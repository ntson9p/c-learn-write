/**
 * Loads and checks the word lists in ./data. The lists are JSON so that a
 * teacher can review and extend them without touching code.
 */
import measureData from './data/measure-words.json';
import modifierData from './data/modifiers.json';
import nonNumberData from './data/non-numbers.json';
import nounData from './data/nouns.json';
import placeData from './data/places.json';
import verbData from './data/verbs.json';
import wordData from './data/words.json';

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
/** Multi-character syllabus words (generated from the course data). */
export const COMPOUND_LIST: readonly string[] = byLengthDesc(stringList((wordData as { words: unknown }).words, 'words.words'));
export const COMPOUNDS: ReadonlySet<string> = new Set(COMPOUND_LIST);

export const NON_NUMBER_PATTERNS: readonly RegExp[] = stringList(
  (nonNumberData as Record<string, unknown>).patterns,
  'non-numbers.patterns',
).map((source) => new RegExp(source, 'gu'));

// ---- Places, localizers and verbs (used for 在哪儿 answers) ----

export type PlaceKind = 'proper' | 'place' | 'object';

export interface PlaceInfo {
  word: string;
  /** proper: 中国 (never + 里); place: 家 (localizer optional); object: 桌子 (localizer required). */
  kind: PlaceKind;
  /** Objects only: the localizer group suggested when it is missing (桌子 -> 上). */
  localizer?: string;
}

const places = placeData as Record<string, unknown>;

/** Localizer word -> its group (上面 -> 上, 里头 -> 里). */
function loadLocalizers(): Map<string, string> {
  const raw = places.localizers;
  if (typeof raw !== 'object' || raw === null) throw new Error('lexicon: places.localizers must be an object');
  const map = new Map<string, string>();
  for (const [group, words] of Object.entries(raw)) {
    for (const word of stringList(words, `places.localizers.${group}`)) {
      if (map.has(word)) throw new Error(`lexicon: localizer ${word} is listed twice`);
      map.set(word, group);
    }
    if (map.get(group) !== group) throw new Error(`lexicon: localizer group ${group} must list itself`);
  }
  return map;
}

function loadPlaces(localizers: ReadonlyMap<string, string>): Map<string, PlaceInfo> {
  const map = new Map<string, PlaceInfo>();
  const add = (info: PlaceInfo) => {
    if (map.has(info.word)) throw new Error(`lexicon: place ${info.word} is listed twice`);
    map.set(info.word, info);
  };
  for (const word of stringList(places.proper, 'places.proper')) add({ word, kind: 'proper' });
  for (const word of stringList(places.places, 'places.places')) add({ word, kind: 'place' });
  const objects = places.objects;
  if (typeof objects !== 'object' || objects === null) throw new Error('lexicon: places.objects must be an object');
  for (const [word, localizer] of Object.entries(objects)) {
    if (typeof localizer !== 'string' || localizers.get(localizer) !== localizer) {
      throw new Error(`lexicon: places.objects.${word} must name a localizer group`);
    }
    add({ word, kind: 'object', localizer });
  }
  return map;
}

export const LOCALIZERS: ReadonlyMap<string, string> = loadLocalizers();
export const LOCALIZER_LIST: readonly string[] = byLengthDesc(LOCALIZERS.keys());
export const PLACES: ReadonlyMap<string, PlaceInfo> = loadPlaces(LOCALIZERS);
export const PLACE_LIST: readonly string[] = byLengthDesc(PLACES.keys());
export const NOT_REVERSED: ReadonlySet<string> = new Set(stringList(places.notReversed, 'places.notReversed'));
/** Time words that can follow 在 but are not places (在晚上). */
export const NOT_PLACES: readonly string[] = byLengthDesc(stringList(places.notPlaces, 'places.notPlaces'));

const verbs = verbData as Record<string, unknown>;
/** Verbs that may be followed directly by 在 + place (住在, 放在). */
export const ZAI_VERBS: ReadonlySet<string> = new Set(stringList(verbs.zaiComplement, 'verbs.zaiComplement'));
/** Action verbs, including the ZAI_VERBS. */
export const ACTION_VERBS: ReadonlySet<string> = new Set([...stringList(verbs.actions, 'verbs.actions'), ...ZAI_VERBS]);
export const ACTION_LIST: readonly string[] = byLengthDesc(ACTION_VERBS);
export const ZAI_LIST: readonly string[] = byLengthDesc(ZAI_VERBS);
export const NOT_ACTIONS: ReadonlySet<string> = new Set(stringList(verbs.notActions, 'verbs.notActions'));

/** The longest word of a length-sorted list found at text[pos], before `end`. */
export function matchLongest(text: string, pos: number, words: readonly string[], end = text.length): string | undefined {
  for (const word of words) {
    if (pos + word.length <= end && text.startsWith(word, pos)) return word;
  }
  return undefined;
}
