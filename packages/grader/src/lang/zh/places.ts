/**
 * Location phrases, for 在哪儿 answers.
 *
 *   在  place word(s)  [的] [localizer]     在家里 · 在桌子上 · 在越南河内 · 在桌子的上面
 *   在  localizer  place word               在上桌子 (Vietnamese order "ở trên bàn": an error)
 *   unit 的 unit                            在桌子上的书包里 · 在学校的食堂
 *
 * A mention is a place phrase after 在 (or after 再 typed instead of it),
 * after a verb that takes a place directly (住河内, 回家), or a bare place
 * answer (书包里。 · 桌子上有一本书).
 */
import { isHan, isLatin } from './chars';
import {
  ACTION_LIST,
  ADJECTIVES,
  LOCALIZERS,
  LOCALIZER_LIST,
  MEASURE_LIST,
  NOT_PLACES,
  NOT_REVERSED,
  PLACES,
  PLACE_LIST,
  matchLongest,
  type PlaceKind,
} from './lexicon';
import { isNumeralChar } from './numbers';
import { homophoneTypos, type TextSpan, type Typo } from './spans';

export interface PlaceNoun extends TextSpan {
  /** The head place the learner meant: a lexicon word, an expected place, or the written text. */
  word: string;
  /** The recognised words of a compound place (越南河内 -> 越南, 河内). */
  words: string[];
  kind: PlaceKind | 'unknown';
  typos: Typo[];
  /** Unknown word one character away from an expected place. */
  near?: string;
}

export interface LocalizerSpan extends TextSpan {
  /** 上面 -> 上. */
  group: string;
}

export interface PlaceUnit {
  noun?: PlaceNoun;
  localizer?: LocalizerSpan;
  /** 在上桌子: the localizer was written before the noun. */
  reversed: boolean;
}

export interface PlacePhrase extends TextSpan {
  /** 桌子上的书包里 has two units. */
  units: PlaceUnit[];
}

export interface LocationMention {
  /** Position of 在 (or of 再 typed instead of it); -1 when there is none. */
  zai: number;
  zaiTypo: boolean;
  /** 住河内, 回家: the verb that takes the place directly. */
  verb?: string;
  phrase: PlacePhrase;
  clause: number;
  /** 不在, 没在, 不是在... */
  negated: boolean;
}

const SINGLE_LOCALIZERS = new Set(['上', '下', '里', '外', '前', '后']);
/** Words in which 在 is not the preposition. */
const NOT_ZAI = ['现在', '存在', '实在', '在于', '自在', '所在', '好在', '在乎', '在意'];
const NEGATIONS = ['不', '没', '没有', '不是'];
/** Verbs that take a place directly, without 在. */
const PLACE_VERBS = ['住', '去', '回', '到', '来'];
const TRAILING_PARTICLES = /[了呢吧啊呀吗啦]+$/u;
/** Characters that cannot be part of an unknown place name. */
const NAME_STOP = new Set([
  '和', '跟', '与', '或', '是', '很', '都', '也', '在', '有', '不', '没', '吗', '呢', '吧', '了', '啊', '呀',
  '的', '还', '就',
]);
const MAX_NAME = 6;

function matchPlaceWord(text: string, p: number, end: number, expected: readonly string[]) {
  let best: string | undefined;
  for (const word of expected) {
    if (p + word.length <= end && text.startsWith(word, p) && (!best || word.length > best.length)) best = word;
  }
  const lexical = matchLongest(text, p, PLACE_LIST, end);
  if (lexical && (!best || lexical.length > best.length)) best = lexical;
  return best ? { word: best, kind: PLACES.get(best)?.kind ?? ('place' as const) } : undefined;
}

/** One or more place words (越南河内), or a homophone typo of an expected place (书报 for 书包). */
function parseNoun(text: string, p: number, end: number, expected: readonly string[]): PlaceNoun | undefined {
  const words: string[] = [];
  let kind: PlaceKind = 'place';
  let q = p;
  while (q < end && words.length < 3) {
    const match = matchPlaceWord(text, q, end, expected);
    if (!match) break;
    words.push(match.word);
    kind = match.kind;
    q += match.word.length;
  }
  if (words.length > 0) {
    return { start: p, end: q, text: text.slice(p, q), word: words[words.length - 1]!, words, kind, typos: [] };
  }
  for (const word of expected) {
    const written = text.slice(p, p + word.length);
    if (PLACES.has(written)) continue;
    const typos = homophoneTypos(text, p, end, word);
    if (typos) {
      const info = PLACES.get(word);
      return { start: p, end: p + word.length, text: written, word, words: [word], kind: info?.kind ?? 'place', typos };
    }
  }
  return undefined;
}

/** A localizer at r, unless r starts a longer verb (家|上网, 车站|上车). */
function localizerAt(text: string, r: number, end: number): LocalizerSpan | undefined {
  const word = matchLongest(text, r, LOCALIZER_LIST, end);
  if (!word) return undefined;
  const verb = matchLongest(text, r, ACTION_LIST, end);
  if (verb && verb.length > word.length) return undefined;
  if ([...NOT_REVERSED].some((w) => r + w.length <= end && text.startsWith(w, r))) return undefined;
  return { start: r, end: r + word.length, text: word, group: LOCALIZERS.get(word)! };
}

/** Is 上桌子 at q a localizer written before its noun (and not a word such as 上海, 上课, 上车)? */
function isReversed(text: string, q: number, end: number, expected: readonly string[]): boolean {
  if (matchPlaceWord(text, q, end, expected)) return false;
  const localizer = matchLongest(text, q, LOCALIZER_LIST, end);
  if (localizer && localizer.length > 1) return false;
  const verb = matchLongest(text, q, ACTION_LIST, end);
  if (verb && verb.length > 1) return false;
  return ![...NOT_REVERSED].some((w) => q + w.length <= end && text.startsWith(w, q));
}

const unitEnd = (u: PlaceUnit) => Math.max(u.noun?.end ?? 0, u.localizer?.end ?? 0);

function parseUnit(text: string, q: number, end: number, expected: readonly string[]): PlaceUnit | undefined {
  const ch = text[q];
  if (ch && SINGLE_LOCALIZERS.has(ch) && isReversed(text, q, end, expected)) {
    const noun = parseNoun(text, q + 1, end, expected);
    if (noun && noun.typos.length === 0) {
      return { noun, localizer: { start: q, end: q + 1, text: ch, group: LOCALIZERS.get(ch)! }, reversed: true };
    }
  }
  const noun = parseNoun(text, q, end, expected);
  if (noun) {
    let localizer = localizerAt(text, noun.end, end);
    if (!localizer && text[noun.end] === '的') {
      // 在桌子的上面: 的 is only possible before a two-syllable localizer.
      const after = localizerAt(text, noun.end + 1, end);
      if (after && after.text.length >= 2) localizer = after;
    }
    return localizer ? { noun, localizer, reversed: false } : { noun, reversed: false };
  }
  const localizer = localizerAt(text, q, end);
  if (localizer && localizer.text.length >= 2) return { localizer, reversed: false }; // 在里面, 在旁边
  return undefined;
}

/** A name the lexicon does not know (阮廌高中, 阿明那儿, ABC公司), after 在. */
function parseUnknown(text: string, p: number, end: number, expected: readonly string[]): PlacePhrase | undefined {
  // Times are not places: 在五月, 在三点, 在晚上.
  if (isNumeralChar(text[p]) || matchLongest(text, p, NOT_PLACES, end)) return undefined;
  let q = p;
  while (q < end && q - p < MAX_NAME) {
    const ch = text[q]!;
    if (!(isHan(ch) || isLatin(ch) || (ch >= '0' && ch <= '9')) || NAME_STOP.has(ch)) break;
    if (q > p && matchLongest(text, q, ACTION_LIST, end)) break;
    q++;
  }
  if (q === p) return undefined;
  let nounEnd = q;
  let localizer: LocalizerSpan | undefined;
  for (let s = p + 1; s < q; s++) {
    const word = text.slice(s, q);
    if (LOCALIZERS.has(word) && !PLACES.has(text.slice(p, q))) {
      localizer = { start: s, end: q, text: word, group: LOCALIZERS.get(word)! };
      nounEnd = s;
      break;
    }
  }
  const written = text.slice(p, nounEnd);
  const noun: PlaceNoun = { start: p, end: nounEnd, text: written, word: written, words: [], kind: 'unknown', typos: [] };
  // A place word at the end of the name makes it a real place (阮廌高中 -> 高中).
  // Objects do not count: 外地 is not a kind of 地.
  for (let s = p + 1; s < nounEnd; s++) {
    const tail = PLACES.get(text.slice(s, nounEnd));
    if (tail?.kind === 'place') {
      noun.word = tail.word;
      noun.words = [tail.word];
      noun.kind = tail.kind;
      break;
    }
  }
  if (noun.kind === 'unknown') {
    for (const word of expected) {
      if (word.length < 2 || word.length > written.length) continue;
      let diff = 0;
      for (let i = 0; i < word.length; i++) if (written[i] !== word[i]) diff++;
      if (diff === 1) {
        noun.near = word;
        break;
      }
    }
  }
  const unit: PlaceUnit = localizer ? { noun, localizer, reversed: false } : { noun, reversed: false };
  return { start: p, end: q, text: text.slice(p, q), units: [unit] };
}

/** 我的房间, 朋友的家: skips a short possessor and its 的. */
function skipPossessor(text: string, p: number, end: number): number {
  let q = p;
  while (q < end && q - p < 4 && isHan(text[q]) && !NAME_STOP.has(text[q]!)) q++;
  return q > p && text[q] === '的' ? q + 1 : p;
}

/** 一个小城市, 这家饭馆, 新家: skips a determiner and adjectives. */
function skipDeterminer(text: string, p: number, end: number): number {
  let q = p;
  const first = text[q];
  if (first === '这' || first === '那' || first === '一') {
    const measure = matchLongest(text, q + 1, MEASURE_LIST, end);
    if (measure) q += 1 + measure.length;
    else if (first === '一') return p;
    else q += 1;
  }
  for (let k = 0; k < 2; k++) {
    const adjective = matchLongest(text, q, ADJECTIVES, end);
    if (!adjective) break;
    q += adjective.length;
    if (text[q] === '的') q++;
  }
  return q;
}

/**
 * The place phrase starting at p, or undefined. `allowUnknown` accepts
 * names the lexicon does not know (only right after 在); `allowPrefix`
 * accepts a possessor or determiner first (在我的房间, 在一个小城市).
 */
export function parsePlacePhrase(
  text: string,
  p: number,
  end: number,
  expected: readonly string[],
  allowUnknown: boolean,
  allowPrefix = true,
): PlacePhrase | undefined {
  if (p >= end) return undefined;
  // 在 + verb is the progressive aspect (我在吃饭), not a place.
  const verb = matchLongest(text, p, ACTION_LIST, end);
  const place = matchPlaceWord(text, p, end, expected);
  if (verb && (!place || verb.length > place.word.length)) return undefined;

  const units: PlaceUnit[] = [];
  let unit = parseUnit(text, p, end, expected);
  if (!unit && allowPrefix) {
    // 我的房间, 一个小城市: the place comes after a possessor or a determiner.
    const start = skipDeterminer(text, skipPossessor(text, p, end), end);
    const after = start > p ? parseUnit(text, start, end, expected) : undefined;
    if (after?.noun) unit = after;
  }
  let q = p;
  while (unit) {
    units.push(unit);
    q = unitEnd(unit);
    if (units.length >= 3 || text[q] !== '的') break;
    const next = parseUnit(text, q + 1, end, expected);
    unit = next?.noun ? next : undefined;
  }
  if (units.length > 0) return { start: p, end: q, text: text.slice(p, q), units };
  return allowUnknown ? parseUnknown(text, p, end, expected) : undefined;
}

const isNotZai = (text: string, z: number) =>
  NOT_ZAI.some((w) => {
    const k = w.indexOf('在');
    return text.slice(z - k, z - k + w.length) === w;
  });

/**
 * Every location mentioned in the answer, clause by clause. A bare object
 * (书包。) only counts as a place when `bareObjects` is set, i.e. in answers
 * to "where" questions; elsewhere 椅子。 is just a chair.
 */
export function findLocations(
  text: string,
  clauses: readonly TextSpan[],
  expected: readonly string[],
  bareObjects = false,
): LocationMention[] {
  const mentions: LocationMention[] = [];
  clauses.forEach((clause, index) => {
    const found: LocationMention[] = [];
    const negatedAt = (pos: number) => NEGATIONS.some((n) => text.slice(clause.start, pos).endsWith(n));

    for (let z = clause.start; z < clause.end; z++) {
      const ch = text[z];
      if (ch !== '在' && ch !== '再') continue;
      if (ch === '在' && isNotZai(text, z)) continue;
      // 再 is only read as a typo of 在 when a known place follows (再家, not 再见).
      const phrase = parsePlacePhrase(text, z + 1, clause.end, expected, ch === '在');
      if (!phrase) continue;
      found.push({ zai: z, zaiTypo: ch === '再', phrase, clause: index, negated: negatedAt(z) });
      z = phrase.end - 1;
    }

    if (found.length === 0) {
      for (let v = clause.start; v < clause.end; v++) {
        const verb = PLACE_VERBS.find((w) => text.startsWith(w, v));
        if (!verb) continue;
        const phrase = parsePlacePhrase(text, v + verb.length, clause.end, expected, false);
        if (phrase) found.push({ zai: -1, zaiTypo: false, verb, phrase, clause: index, negated: negatedAt(v) });
      }
    }

    if (found.length === 0) {
      const phrase = parsePlacePhrase(text, clause.start, clause.end, expected, false, false);
      const objectOnly = phrase?.units.every((u) => u.noun?.kind === 'object' && !u.localizer);
      if (phrase && (bareObjects || !objectOnly)) {
        const rest = text.slice(phrase.end, clause.end).replace(TRAILING_PARTICLES, '');
        if (rest === '' || rest.startsWith('有')) found.push({ zai: -1, zaiTypo: false, phrase, clause: index, negated: false });
      }
    }
    mentions.push(...found);
  });
  return mentions;
}
