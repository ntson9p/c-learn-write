import * as OpenCC from 'opencc-js/t2cn';

export interface ZhNormalized {
  /** The cleaned answer; every issue span refers to this text. */
  text: string;
  /** True when traditional characters were converted to simplified ones. */
  convertedTraditional: boolean;
}

let toSimplified: ((text: string) => string) | undefined;

/**
 * Cleans a learner answer:
 * - Unicode NFC, zero-width characters removed
 * - full-width digits and Latin letters (４, Ａ) turned into ASCII
 * - all whitespace removed (Chinese does not separate words with spaces)
 * - traditional characters converted to simplified ones (OpenCC)
 * Chinese punctuation is kept as written.
 */
export function normalizeZh(input: string): ZhNormalized {
  let text = input.normalize('NFC');
  text = text.replace(/[​-‍⁠﻿]/g, '');
  text = text.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
  text = text.replace(/\s+/gu, '');
  toSimplified ??= OpenCC.Converter({ from: 't', to: 'cn' });
  const simplified = toSimplified(text);
  return { text: simplified, convertedTraditional: simplified !== text };
}
