/**
 * Downloads the source data at pinned commits and keeps the part we use
 * (HSK levels 1-3) in sources/. Run: npm run sources:fetch -w @c-learn-write/course
 *
 * - ofou/hsk: machine-readable copy of the 2025 HSK exam syllabus
 *   (CLEC, 《中文水平考试 HSK 考试大纲》), MIT. The official example sentences
 *   (例句) of the grammar list are NOT kept: they are creative text.
 * - ph0ngp/hanviet-pinyin-wordlist: Sino-Vietnamese readings, MIT.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as OpenCC from 'opencc-js';
import { parseCsv, toCsv } from '../src/csv.ts';

const OFOU = { repo: 'ofou/hsk', commit: '14d4612ed99766f1385bd49730aabf8a96dc145f' };
const HANVIET = { repo: 'ph0ngp/hanviet-pinyin-wordlist', commit: 'b9923df92c8b55f013001390e37cddd35e986dc1' };
const LEVELS = new Set(['一级', '二级', '三级']);

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'sources');

async function download(repo: string, commit: string, file: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${repo}/${commit}/${encodeURIComponent(file)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return await res.text();
}

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

function write(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
  console.log('wrote', path);
}

/** Level column: "一级", or "一级（四级）" when a later sense is graded higher. */
const baseLevel = (value: string) => value.replace(/（.*$/, '');

const hashes: string[] = [];

async function keep(file: string, out: string, filter: (row: string[], header: string[]) => boolean, dropColumns: string[] = []) {
  const text = await download(OFOU.repo, OFOU.commit, file);
  hashes.push(`| \`${file}\` | \`${sha256(text)}\` |`);
  const [header, ...rows] = parseCsv(text);
  if (!header) throw new Error(`${file}: empty`);
  const keepIdx = header.map((h, i) => (dropColumns.includes(h) ? -1 : i)).filter((i) => i >= 0);
  const kept = rows.filter((r) => r.some((c) => c !== '') && filter(r, header));
  write(join(root, 'hsk-2025', out), toCsv([keepIdx.map((i) => header[i]!), ...kept.map((r) => keepIdx.map((i) => r[i] ?? ''))]));
  return kept;
}

const levelOf = (r: string[], header: string[]) => LEVELS.has(baseLevel(r[header.indexOf('级别')] ?? ''));

const words = await keep('词汇.csv', 'vocabulary.csv', levelOf);
await keep('汉字.csv', 'characters.csv', levelOf);
await keep('手写汉字.csv', 'handwriting.csv', levelOf);
await keep('语法.csv', 'grammar.csv', levelOf, ['例句']);
const ofouLicense = await download(OFOU.repo, OFOU.commit, 'LICENSE');
write(join(root, 'hsk-2025', 'LICENSE'), ofouLicense);

write(
  join(root, 'hsk-2025', 'SOURCE.md'),
  `# Nguồn: đề cương thi HSK 2025 (cấp 1–3)

- Văn bản gốc: 《中文水平考试 HSK 考试大纲》, 中外语言交流合作中心 (CLEC), phát hành 2025-11, hiệu lực 2026-07: <https://www.chinesetest.cn/HSK>.
- Bản chép máy đọc được: <https://github.com/${OFOU.repo}> tại commit \`${OFOU.commit}\`, giấy phép MIT (file \`LICENSE\` bên cạnh).
- Các file ở đây chỉ giữ cấp 1–3. Cột 例句 (câu ví dụ chính thức) của danh sách ngữ pháp đã bị bỏ, vì đó là văn bản sáng tạo.
- Danh sách từ HSK1–3 đã được đối chiếu với file PDF chính thức ngày 2026-11-14: khớp 1000/1000 từ (số thứ tự, cấp, từ).
- Tạo lại bằng \`npm run sources:fetch -w @c-learn-write/course\`.

SHA-256 của các file gốc đã tải:

| File | SHA-256 |
|---|---|
${hashes.join('\n')}
`,
);

// Sino-Vietnamese readings: keep the rows of every traditional form of an HSK 1-3 character.
const toTrad = OpenCC.Converter({ from: 'cn', to: 't' });
const toTw = OpenCC.Converter({ from: 'cn', to: 'tw' });
const wanted = new Set<string>();
for (const r of words) {
  const word = (r[2] ?? '').replace(/[0-9]/g, '');
  for (const text of [word, toTrad(word), toTw(word)]) for (const ch of text) wanted.add(ch);
  for (const ch of word) for (const t of [toTrad(ch), toTw(ch)]) for (const c of t) wanted.add(c);
}
const hvText = await download(HANVIET.repo, HANVIET.commit, 'hanviet.csv');
const [hvHeader, ...hvRows] = parseCsv(hvText);
const hvKept = hvRows.filter((r) => wanted.has(r[0] ?? ''));
write(join(root, 'hanviet', 'hanviet.csv'), toCsv([hvHeader!, ...hvKept]));
write(join(root, 'hanviet', 'LICENSE'), await download(HANVIET.repo, HANVIET.commit, 'LICENSE'));
write(
  join(root, 'hanviet', 'SOURCE.md'),
  `# Nguồn: âm Hán Việt

- <https://github.com/${HANVIET.repo}> tại commit \`${HANVIET.commit}\`, giấy phép MIT (file \`LICENSE\` bên cạnh), tác giả Phong Phan.
- Mỗi dòng: chữ phồn thể, các âm Hán Việt, pinyin có số thanh. Ở đây chỉ giữ ${hvKept.length} dòng của các chữ (và dạng phồn thể của chúng) xuất hiện trong từ vựng HSK1–3.
- SHA-256 của \`hanviet.csv\` gốc: \`${sha256(hvText)}\`.
- Tạo lại bằng \`npm run sources:fetch -w @c-learn-write/course\`.
`,
);
