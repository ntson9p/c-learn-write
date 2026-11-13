/**
 * Sentence analysis for Chinese answers.
 *
 * Instead of a general-purpose parser (which breaks easily on learner
 * mistakes), the analysis looks for quantity phrases, the structure that
 * carries the facts of a count answer:
 *
 *   number  [measure word]  [modifiers]  [noun]  [misplaced modifier]
 *   四        个              绿           苹果
 *
 * Words are recognised with the lexicon, so results are deterministic and
 * identical in every JavaScript runtime.
 */
import { isClauseBreak, isHan } from './chars';
import {
  ADJECTIVES,
  COLORS,
  MEASURE_LIST,
  MEASURE_WORDS,
  NON_NUMBER_PATTERNS,
  NOUN_LIST,
  NOUNS,
  SHADES,
  matchLongest,
  type MeasureInfo,
} from './lexicon';
import { NUMERAL_RUN, isNumeralChar, parseZhNumber, type ParsedNumber } from './numbers';
import { isHomophone } from './pinyin';

export interface TextSpan {
  start: number;
  end: number;
  text: string;
}

export interface NumberSpan extends TextSpan {
  parsed: ParsedNumber;
  /** 四五个, 十几个, 二十多个, 几十个. */
  approximate: boolean;
  /** Position right after the number and its approximation marker (多/几/来/余). */
  after: number;
}

export interface MeasureSpan extends TextSpan {
  info: MeasureInfo;
}

export interface ModifierSpan extends TextSpan {
  kind: 'color' | 'adjective';
  /** The word without shade, 色 or 的 (绿 in 浅绿色的); for a typo, the intended word. */
  base: string;
  /** Homophone typos of an expected colour (率 for 绿). */
  typos?: Typo[];
}

export interface Typo {
  index: number;
  written: string;
  expected: string;
}

export interface NounSpan extends TextSpan {
  /** The noun the learner meant: a lexicon word, an expected noun or the unknown text. */
  noun: string;
  match: 'exact' | 'homophone' | 'unknown';
  typos: Typo[];
  /** Unknown word one character away from an expected noun (苹里 ~ 苹果). */
  near?: string;
}

export interface QuantityPhrase {
  start: number;
  end: number;
  /** Index into ZhDoc.clauses. */
  clause: number;
  number: NumberSpan;
  measure?: MeasureSpan;
  modifiers: ModifierSpan[];
  noun?: NounSpan;
  /** Modifiers placed after the noun, as in 苹果绿 (a word-order error). */
  trailing: ModifierSpan[];
  /** Preceded in its clause by 没(有), 不是, 不止, 不到... */
  negated: boolean;
  /** Clause text before the number. */
  prefix: string;
}

export interface ZhDoc {
  text: string;
  clauses: TextSpan[];
  phrases: QuantityPhrase[];
}

export interface AnalyzeOptions {
  /** Nouns the answer should mention; enables homophone matching for them. */
  expectedNouns?: readonly string[];
  /** Colours the answer should mention; enables homophone matching for them. */
  expectedColors?: readonly string[];
}

const APPROX_AFTER_UNIT = new Set(['多', '来', '余']);
const NEGATIONS = ['没有', '没', '不是', '不有', '不止', '不到', '不只'];
const CONJUNCTIONS = ['还有', '或者', '以及', '和', '跟', '与', '或'];
/** Characters that cannot be part of an unknown noun. */
const UNKNOWN_STOP = new Set([
  '和', '跟', '与', '或', '是', '很', '都', '也', '在', '有', '不', '没', '吗', '呢', '吧', '了',
  '啊', '呀', '的', '还', '就', '太', '真', '最', '比', '更',
]);
const MAX_UNKNOWN_NOUN = 4;
const UNIT_CHARS = new Set(['十', '拾', '百', '佰', '千', '仟', '万', '亿']);

export function splitClauses(text: string): TextSpan[] {
  const clauses: TextSpan[] = [];
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || isClauseBreak(text[i])) {
      if (i > start) clauses.push({ start, end: i, text: text.slice(start, i) });
      start = i + 1;
    }
  }
  return clauses;
}

/** Numeral runs that really are numbers (not 一起, 星期四, 第四...). */
export function findNumberSpans(text: string): TextSpan[] {
  const blocked = new Uint8Array(text.length);
  for (const re of NON_NUMBER_PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      blocked.fill(1, start, start + m[0].length);
    }
  }
  const spans: TextSpan[] = [];
  NUMERAL_RUN.lastIndex = 0;
  for (const m of text.matchAll(NUMERAL_RUN)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    let runStart = -1;
    for (let i = start; i <= end; i++) {
      const free = i < end && blocked[i] === 0;
      if (free && runStart < 0) runStart = i;
      else if (!free && runStart >= 0) {
        spans.push({ start: runStart, end: i, text: text.slice(runStart, i) });
        runStart = -1;
      }
    }
  }
  return spans.filter((span) => text[span.start - 1] !== '第');
}

function isPhraseBoundary(text: string, pos: number, end: number): boolean {
  return pos >= end || CONJUNCTIONS.some((c) => pos + c.length <= end && text.startsWith(c, pos));
}

function matchModifier(text: string, p: number, end: number): ModifierSpan | undefined {
  const shade = matchLongest(text, p, SHADES, end);
  const colorStart = shade ? p + shade.length : p;
  const color = matchLongest(text, colorStart, COLORS, end);
  if (color) {
    let q = colorStart + color.length;
    if (q < end && text[q] === '色') q++;
    if (q < end && text[q] === '的') q++;
    return { start: p, end: q, text: text.slice(p, q), kind: 'color', base: color };
  }
  const adjective = matchLongest(text, p, ADJECTIVES, end);
  if (adjective) {
    let q = p + adjective.length;
    if (q < end && text[q] === '的') q++;
    return { start: p, end: q, text: text.slice(p, q), kind: 'adjective', base: adjective };
  }
  return undefined;
}

/**
 * Compares `word` with the text at p, character by character: every
 * character must be equal or a homophone, with at least one homophone.
 * Returns the typos, or undefined when the text is not a typo of `word`.
 */
function homophoneTypos(text: string, p: number, end: number, word: string): Typo[] | undefined {
  if (p + word.length > end) return undefined;
  const typos: Typo[] = [];
  let exactChars = 0;
  for (let i = 0; i < word.length; i++) {
    const w = text[p + i]!;
    const e = word[i]!;
    if (w === e) exactChars++;
    else if (isHan(w) && !isNumeralChar(w) && isHomophone(w, e)) typos.push({ index: p + i, written: w, expected: e });
    else return undefined;
  }
  if (typos.length === 0 || (word.length >= 2 && exactChars === 0)) return undefined;
  return typos;
}

/** A homophone typo of an expected colour, e.g. 率苹果 for 绿苹果. */
function matchColorTypo(text: string, p: number, end: number, colors: readonly string[]): ModifierSpan | undefined {
  for (const color of colors) {
    const typos = homophoneTypos(text, p, end, color);
    if (!typos) continue;
    let q = p + color.length;
    if (q < end && text[q] === '色') q++;
    if (q < end && text[q] === '的') q++;
    return { start: p, end: q, text: text.slice(p, q), kind: 'color', base: color, typos };
  }
  return undefined;
}

function matchNoun(text: string, p: number, end: number, expected: readonly string[]): NounSpan | undefined {
  let best: string | undefined;
  for (const word of expected) {
    if (p + word.length <= end && text.startsWith(word, p) && (!best || word.length > best.length)) best = word;
  }
  const lexical = matchLongest(text, p, NOUN_LIST, end);
  if (lexical && (!best || lexical.length > best.length)) best = lexical;
  if (best) return { start: p, end: p + best.length, text: best, noun: best, match: 'exact', typos: [] };

  // A homophone of an expected noun (平果 for 苹果), unless the written word is
  // itself a known noun (then the learner said something else).
  for (const word of expected) {
    const written = text.slice(p, p + word.length);
    if (NOUNS.has(written)) continue;
    const typos = homophoneTypos(text, p, end, word);
    if (typos) return { start: p, end: p + word.length, text: written, noun: word, match: 'homophone', typos };
  }
  return undefined;
}

function matchUnknownNoun(
  text: string,
  p: number,
  end: number,
  expected: readonly string[],
  numberStarts: ReadonlySet<number>,
): NounSpan | undefined {
  let q = p;
  while (q < end && q - p < MAX_UNKNOWN_NOUN) {
    const ch = text[q];
    if (!isHan(ch) || UNKNOWN_STOP.has(ch!) || numberStarts.has(q)) break;
    // Stop before a modifier that ends the phrase (芒果|绿), so that the
    // word-order check can see it.
    if (q > p) {
      const modifier = matchModifier(text, q, end);
      if (modifier && isPhraseBoundary(text, modifier.end, end)) break;
    }
    q++;
  }
  if (q === p) return undefined;
  const written = text.slice(p, q);
  const span: NounSpan = { start: p, end: q, text: written, noun: written, match: 'unknown', typos: [] };
  for (const word of expected) {
    if (word.length < 2 || word.length > written.length) continue;
    let diff = 0;
    for (let i = 0; i < word.length; i++) if (written[i] !== word[i]) diff++;
    if (diff === 1) {
      span.near = word;
      break;
    }
  }
  return span;
}

function parseNounPhrase(
  text: string,
  pos: number,
  end: number,
  expected: readonly string[],
  expectedColors: readonly string[],
  numberStarts: ReadonlySet<number>,
) {
  const modifiers: ModifierSpan[] = [];
  let p = pos;
  let noun: NounSpan | undefined;
  while (p < end && modifiers.length < 4 && !numberStarts.has(p)) {
    noun = matchNoun(text, p, end, expected);
    if (noun) break;
    const modifier = matchModifier(text, p, end) ?? matchColorTypo(text, p, end, expectedColors);
    if (!modifier) break;
    modifiers.push(modifier);
    p = modifier.end;
  }
  if (!noun && p < end) noun = matchUnknownNoun(text, p, end, expected, numberStarts);
  let phraseEnd = noun ? noun.end : p;
  const trailing: ModifierSpan[] = [];
  if (noun) {
    const modifier = matchModifier(text, phraseEnd, end);
    if (modifier && isPhraseBoundary(text, modifier.end, end)) {
      trailing.push(modifier);
      phraseEnd = modifier.end;
    }
  }
  return { modifiers, noun, trailing, end: phraseEnd };
}

export function analyzeZh(text: string, options: AnalyzeOptions = {}): ZhDoc {
  const expected = options.expectedNouns ?? [];
  const expectedColors = options.expectedColors ?? [];
  const clauses = splitClauses(text);
  const spans = findNumberSpans(text);
  const numberStarts = new Set(spans.map((s) => s.start));
  const phrases: QuantityPhrase[] = [];
  let lastEnd = 0;

  for (const span of spans) {
    if (span.start < lastEnd) continue;
    const parsed = parseZhNumber(span.text);
    if (!parsed) continue;
    const clauseIndex = clauses.findIndex((c) => span.start >= c.start && span.end <= c.end);
    const clause = clauses[clauseIndex];
    if (!clause) continue;

    let pos = span.end;
    let approximate = parsed.range !== undefined || text[span.start - 1] === '几';
    const next = text[pos];
    if (pos < clause.end && !parsed.digitString) {
      if (next === '几' || (APPROX_AFTER_UNIT.has(next!) && UNIT_CHARS.has(span.text[span.text.length - 1]!))) {
        approximate = true;
        pos++;
      }
    }
    const after = pos;

    let measure: MeasureSpan | undefined;
    const word = matchLongest(text, pos, MEASURE_LIST, clause.end);
    if (word) {
      measure = { start: pos, end: pos + word.length, text: word, info: MEASURE_WORDS.get(word)! };
      pos = measure.end;
    }

    const np = parseNounPhrase(text, pos, clause.end, expected, expectedColors, numberStarts);
    const prefix = text.slice(clause.start, span.start);
    phrases.push({
      start: span.start,
      end: Math.max(np.end, pos),
      clause: clauseIndex,
      number: { ...span, parsed, approximate, after },
      measure,
      modifiers: np.modifiers,
      noun: np.noun,
      trailing: np.trailing,
      negated: NEGATIONS.some((n) => prefix.endsWith(n)),
      prefix,
    });
    lastEnd = Math.max(np.end, pos);
  }
  return { text, clauses, phrases };
}
