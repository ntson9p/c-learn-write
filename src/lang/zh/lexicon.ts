/**
 * Loads and checks the word lists in ./data. The lists are JSON so that a
 * teacher can review and extend them without touching code.
 */
import measureData from './data/measure-words.json';
import modifierData from './data/modifiers.json';
import nonNumberData from './data/non-numbers.json';
import nounData from './data/nouns.json';

export type MeasureKind = 'individual' | 'general' | 'container' | 'time' | 'calendar' | 'money' | 'measure' | 'ordinal';

export interface MeasureInfo {
  word: string;
  kind: MeasureKind;
  /** 二 is acceptable right before this word (otherwise 两 is required). */
  erOk: boolean;
}

export interface NounInfo {
  word: string;
  /** Accepted measure words; the first one is suggested in corrections. */
  measures: string[];
  /** "ok": a number may come right before it; "formal": only in formal writing. */
  bare?: 'ok' | 'formal';
}

const MEASURE_KINDS: readonly MeasureKind[] = [
  'individual', 'general', 'container', 'time', 'calendar', 'money', 'measure', 'ordinal',
];

function stringList(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string' && v.length > 0)) {
    throw new Error(`lexicon: ${where} must be a list of non-empty strings`);
  }
  return value as string[];
}

function loadMeasures(): Map<string, MeasureInfo> {
  const data = measureData as Record<string, unknown>;
  const erOk = new Set(stringList(data.erOk, 'measure-words.erOk'));
  const map = new Map<string, MeasureInfo>();
  for (const kind of MEASURE_KINDS) {
    for (const word of stringList(data[kind], `measure-words.${kind}`)) {
      if (map.has(word)) throw new Error(`lexicon: measure word ${word} is listed twice`);
      map.set(word, { word, kind, erOk: erOk.has(word) });
    }
  }
  for (const word of erOk) {
    if (!map.has(word)) throw new Error(`lexicon: erOk word ${word} is not a measure word`);
  }
  return map;
}

function loadNouns(measures: ReadonlyMap<string, MeasureInfo>): Map<string, NounInfo> {
  const raw = (nounData as { nouns: Record<string, unknown> }).nouns;
  const map = new Map<string, NounInfo>();
  for (const [word, value] of Object.entries(raw)) {
    let info: NounInfo;
    if (Array.isArray(value)) {
      info = { word, measures: stringList(value, `nouns.${word}`) };
    } else if (typeof value === 'object' && value !== null) {
      const obj = value as { measures?: unknown; bare?: unknown };
      info = { word, measures: stringList(obj.measures, `nouns.${word}.measures`) };
      if (obj.bare !== undefined) {
        if (obj.bare !== 'ok' && obj.bare !== 'formal') throw new Error(`lexicon: nouns.${word}.bare must be "ok" or "formal"`);
        info.bare = obj.bare;
      }
    } else {
      throw new Error(`lexicon: nouns.${word} must be a list or an object`);
    }
    if (info.measures.length === 0) throw new Error(`lexicon: nouns.${word} needs at least one measure word`);
    for (const m of info.measures) {
      const kind = measures.get(m)?.kind;
      if (kind !== 'individual' && kind !== 'container') {
        throw new Error(`lexicon: nouns.${word} uses ${m}, which is not an individual or container measure word`);
      }
    }
    map.set(word, info);
  }
  return map;
}

const byLengthDesc = (words: Iterable<string>) => [...words].sort((a, b) => b.length - a.length || a.localeCompare(b));

export const MEASURE_WORDS: ReadonlyMap<string, MeasureInfo> = loadMeasures();
export const NOUNS: ReadonlyMap<string, NounInfo> = loadNouns(MEASURE_WORDS);

const modifiers = modifierData as Record<string, unknown>;
export const COLORS: readonly string[] = byLengthDesc(stringList(modifiers.colors, 'modifiers.colors'));
export const SHADES: readonly string[] = byLengthDesc(stringList(modifiers.shades, 'modifiers.shades'));
export const ADJECTIVES: readonly string[] = byLengthDesc(stringList(modifiers.adjectives, 'modifiers.adjectives'));

export const MEASURE_LIST: readonly string[] = byLengthDesc(MEASURE_WORDS.keys());
export const NOUN_LIST: readonly string[] = byLengthDesc(NOUNS.keys());

export const NON_NUMBER_PATTERNS: readonly RegExp[] = stringList(
  (nonNumberData as Record<string, unknown>).patterns,
  'non-numbers.patterns',
).map((source) => new RegExp(source, 'gu'));

/** The longest word of a length-sorted list found at text[pos], before `end`. */
export function matchLongest(text: string, pos: number, words: readonly string[], end = text.length): string | undefined {
  for (const word of words) {
    if (pos + word.length <= end && text.startsWith(word, pos)) return word;
  }
  return undefined;
}
