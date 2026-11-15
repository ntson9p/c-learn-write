import * as OpenCC from 'opencc-js/t2cn';

export interface ZhNormalized {
  /** The cleaned answer; every issue span refers to this text. */
  text: string;
  /** True when traditional characters were converted to simplified ones. */
  convertedTraditional: boolean;
}

let toSimplified: ((text: string) => string) | undefined;

/** Invisible format characters: zero-width space/joiners, BOM, bidi marks... */
const FORMAT_CHARS = /\p{Cf}/gu;
/** Full-width digits and Latin letters. */
const FULL_WIDTH_ASCII = /[０-９Ａ-Ｚａ-ｚ]/gu;
/** One or more line breaks, with the spaces around them. */
const LINE_BREAKS = /\s*[\r\n\p{Zl}\p{Zp}]+\s*/gu;
const FULL_WIDTH_OFFSET = 0xfee0;

/**
 * Cleans a learner answer:
 * - Unicode NFC, invisible format characters removed
 * - full-width digits and Latin letters (４, Ａ) turned into ASCII
 * - line breaks inside the answer become "，" so that clauses stay apart
 * - all other whitespace removed (Chinese does not separate words with spaces)
 * - traditional characters converted to simplified ones (OpenCC)
 * Chinese punctuation is kept as written.
 */
export function normalizeZh(input: string): ZhNormalized {
  let text = input.normalize('NFC');
  text = text.replace(FORMAT_CHARS, '');
  text = text.replace(FULL_WIDTH_ASCII, (ch) => String.fromCharCode(ch.charCodeAt(0) - FULL_WIDTH_OFFSET));
  text = text.trim().replace(LINE_BREAKS, '，');
  text = text.replace(/\s+/gu, '');
  toSimplified ??= OpenCC.Converter({ from: 't', to: 'cn' });
  const simplified = toSimplified(text);
  return { text: simplified, convertedTraditional: simplified !== text };
}
