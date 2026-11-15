/**
 * Builds data/hsk/*.json from sources/ (run: npm run data:build -w @c-learn-write/course).
 * The output is deterministic: running it again gives identical files.
 *
 * - vocabulary.json: the 1000 words of HSK 1-3 with pinyin cut into one
 *   numbered syllable per character, part of speech, and a Hán Việt reading.
 * - characters.json: recognition and handwriting characters per level.
 * - grammar.json: the 244 grammar points (without the official examples).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as OpenCC from 'opencc-js';
import { pinyin as pinyinPro } from 'pinyin-pro';
import { parseCsvObjects } from '../src/csv.ts';
import { alignWordPinyin, numbered } from '../src/pinyin.ts';
import { readingsOf } from '../src/readings.ts';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => parseCsvObjects(readFileSync(join(pkg, path), 'utf8'));
const LEVEL: Record<string, number> = { 一级: 1, 二级: 2, 三级: 3, 四级: 4, 五级: 5, 六级: 6, '七-九级': 7 };

function levels(value: string): { level: number; also: number[] } {
  const parts = value.split(/[（）]/).filter(Boolean);
  const nums = parts.map((p) => {
    const n = LEVEL[p];
    if (n === undefined) throw new Error(`unknown level "${p}" in "${value}"`);
    return n;
  });
  return { level: nums[0]!, also: nums.slice(1) };
}

// ---- Hán Việt -------------------------------------------------------------
type HvRow = { char: string; readings: string[]; pinyin: string };
const hvRows: HvRow[] = read('sources/hanviet/hanviet.csv').map((r) => ({
  char: r.char!,
  // The CSV stores a Python-style list: "['hoà', 'hoạ']".
  readings: [...(r.hanviet ?? '').matchAll(/'([^']*)'/g)].map((m) => m[1]!.normalize('NFC')),
  pinyin: r.pinyin!,
}));
const hvByChar = new Map<string, HvRow[]>();
for (const row of hvRows) hvByChar.set(row.char, [...(hvByChar.get(row.char) ?? []), row]);

const toTrad = OpenCC.Converter({ from: 'cn', to: 't' });
const toTw = OpenCC.Converter({ from: 'cn', to: 'tw' });

/** Hán Việt of one character read as `syllable` ("lü4"); undefined when unknown. */
function hanVietOf(chars: string[], syllable: string, citation?: string): { reading?: string; ambiguous: boolean } {
  if (syllable === 'r5') return { ambiguous: false }; // erhua 儿 has no reading of its own
  const key = syllable.replace('ü', 'u:');
  const base = key.replace(/[1-5]$/, '');
  // A neutral tone (上 in 晚上) is looked up with the character's citation tone (shang4).
  const citationKey = citation?.replace('ü', 'u:').replace('v', 'u:');
  const keys = key.endsWith('5') && citationKey && citationKey.replace(/[1-5]$/, '') === base ? [citationKey, key] : [key];
  for (const ch of chars) {
    const rows = hvByChar.get(ch) ?? [];
    const exact = rows.filter((r) => keys.includes(r.pinyin)).sort((a, b) => keys.indexOf(a.pinyin) - keys.indexOf(b.pinyin));
    const any = rows.filter((r) => r.pinyin === '*');
    const toneless = rows.filter((r) => r.pinyin.replace(/[1-5]$/, '') === base);
    for (const found of [exact, any, toneless]) {
      if (found.length === 0) continue;
      const all = [...new Set(found.flatMap((r) => r.readings))];
      if (all.length > 0) return { reading: all[0], ambiguous: all.length > 1 };
    }
  }
  return { ambiguous: false };
}

// ---- Vocabulary -------------------------------------------------------------
interface VocabEntry {
  no: number;
  level: number;
  alsoLevels?: number[];
  word: string;
  sense?: number;
  pinyin: string;
  syllables: string[];
  pos: string[];
  posLater?: string[];
  hanViet: string | null;
  hanVietAmbiguous?: true;
}

const problems: string[] = [];
const vocabulary: VocabEntry[] = read('sources/hsk-2025/vocabulary.csv').map((r) => {
  const no = Number(r['No.']);
  const raw = r['词语']!;
  const word = raw.replace(/[0-9]+$/, '');
  const sense = raw === word ? undefined : Number(raw.slice(word.length));
  const { level, also } = levels(r['级别']!);
  const syllables = alignWordPinyin(word, r['拼音']!, readingsOf);
  if (!syllables) throw new Error(`cannot align pinyin of ${raw} ${r['拼音']}`);
  const numberedSyl = syllables.map(numbered);

  // "形、介、（量、动）": parts in brackets belong to senses graded at a higher level.
  const pos: string[] = [];
  const posLater: string[] = [];
  let depth = 0;
  for (const part of (r['词性'] ?? '').split('、')) {
    if (part.startsWith('（')) depth++;
    const name = part.replace(/[（）]/g, '');
    if (name) (depth > 0 ? posLater : pos).push(name);
    if (part.endsWith('）')) depth = Math.max(0, depth - 1);
  }

  const citation = pinyinPro(word, { type: 'array', toneType: 'num', v: false }) as string[];
  const trad = [...toTrad(word)];
  const tw = [...toTw(word)];
  const chars = [...word];
  let ambiguous = false;
  const parts: string[] = [];
  let complete = true;
  chars.forEach((ch, i) => {
    const hv = hanVietOf([...new Set([trad[i] ?? ch, tw[i] ?? ch, ch])], numberedSyl[i]!, citation[i]);
    if (numberedSyl[i] === 'r5') return;
    if (!hv.reading) {
      complete = false;
      problems.push(`${no} ${raw}: no Hán Việt for ${ch} (${numberedSyl[i]})`);
    } else parts.push(hv.reading);
    if (hv.ambiguous) ambiguous = true;
  });

  const entry: VocabEntry = { no, level, word, pinyin: r['拼音']!, syllables: numberedSyl, pos, hanViet: complete ? parts.join(' ') : null };
  if (also.length > 0) entry.alsoLevels = also;
  if (sense !== undefined) entry.sense = sense;
  if (posLater.length > 0) entry.posLater = posLater;
  if (ambiguous) entry.hanVietAmbiguous = true;
  return entry;
});

// ---- Characters and grammar ---------------------------------------------------
const recognition: Record<string, string[]> = {};
for (const r of read('sources/hsk-2025/characters.csv')) (recognition[String(levels(r['级别']!).level)] ??= []).push(r['汉字']!);
const handwriting: Record<string, string[]> = {};
for (const r of read('sources/hsk-2025/handwriting.csv')) (handwriting[String(levels(r['级别']!).level)] ??= []).push(r['汉字']!);

const grammar = read('sources/hsk-2025/grammar.csv').map((r) => ({
  no: Number(r['No.']),
  level: levels(r['级别']!).level,
  category: r['类别'] ?? '',
  categoryName: r['类别名称'] ?? '',
  item: (r['细目'] ?? '').replace(/\n/g, ' / '),
  content: (r['语法内容'] ?? '').replace(/\n/g, ' / '),
}));

// ---- Write -------------------------------------------------------------------
/** One array item per line: readable diffs, still valid JSON. */
function arrayJson(items: unknown[]): string {
  return `[\n${items.map((i) => `  ${JSON.stringify(i)}`).join(',\n')}\n]\n`;
}
const out = (name: string, text: string) => {
  writeFileSync(join(pkg, 'data', 'hsk', name), text, 'utf8');
  console.log('wrote data/hsk/' + name);
};
out('vocabulary.json', arrayJson(vocabulary));
out('grammar.json', arrayJson(grammar));
out('characters.json', `${JSON.stringify({ recognition, handwriting }, null, 1)}\n`);

// The grader uses the multi-character syllabus words to avoid reading 书店 as 书 + 店.
const compounds = [...new Set(vocabulary.map((v) => v.word).filter((w) => [...w].length >= 2))].sort();
writeFileSync(
  join(pkg, '..', 'grader', 'src', 'lang', 'zh', 'data', 'words.json'),
  `{\n  "_doc": "Multi-character words of HSK levels 1-3 (2025 syllabus). GENERATED by packages/course/scripts/build-data.ts: do not edit. A noun of nouns.json that is only the start of one of these words (书 in 书店) is not taken as that noun.",\n  "words": ${JSON.stringify(compounds)}\n}\n`,
  'utf8',
);
console.log(`wrote grader words.json (${compounds.length} words)`);

const ambiguousCount = vocabulary.filter((v) => v.hanVietAmbiguous).length;
console.log(`${vocabulary.length} words, ${grammar.length} grammar points; Hán Việt missing for ${vocabulary.filter((v) => v.hanViet === null).length} words, ambiguous for ${ambiguousCount}`);
for (const p of problems) console.log('  ' + p);
