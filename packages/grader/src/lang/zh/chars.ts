/** Character classes used by the Chinese pack. */

const HAN = /\p{Script=Han}/u;
const LATIN = /[A-Za-z]/;

export function isHan(ch: string | undefined): boolean {
  return ch !== undefined && HAN.test(ch);
}

export function hasHan(text: string): boolean {
  return HAN.test(text);
}

export function isLatin(ch: string | undefined): boolean {
  return ch !== undefined && LATIN.test(ch);
}

/** Punctuation that ends a clause (Chinese and ASCII forms). */
const CLAUSE_BREAKS = new Set([
  '，', ',', '。', '.', '！', '!', '？', '?', '；', ';', '：', ':', '、', '…', '～', '~', '\n',
]);

export function isClauseBreak(ch: string | undefined): boolean {
  return ch !== undefined && CLAUSE_BREAKS.has(ch);
}

const IGNORABLE = /[\p{P}\p{S}\s]/u;

/** Punctuation, symbols and spaces: ignored when answers are compared. */
export function isIgnorable(ch: string | undefined): boolean {
  return ch !== undefined && IGNORABLE.test(ch);
}
