import { isHan } from './chars';
import { isNumeralChar } from './numbers';
import { isHomophone } from './pinyin';

export interface TextSpan {
  start: number;
  end: number;
  text: string;
}

export interface Typo {
  index: number;
  written: string;
  expected: string;
}

/**
 * Compares `word` with the text at p, character by character: every
 * character must be equal or a homophone, with at least one homophone (and,
 * for longer words, at least one equal character). Returns the typos, or
 * undefined when the text is not a typo of `word`.
 */
export function homophoneTypos(text: string, p: number, end: number, word: string): Typo[] | undefined {
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

/** Applies typo corrections to text[start, end). */
export function fixTypos(text: string, start: number, end: number, typos: readonly Typo[]): string {
  let out = '';
  for (let i = start; i < end; i++) {
    out += typos.find((t) => t.index === i)?.expected ?? text[i];
  }
  return out;
}
