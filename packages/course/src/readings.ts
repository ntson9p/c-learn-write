/**
 * Possible readings of a character, from pinyin-pro's dictionary (tone-less,
 * ü kept). Used by scripts and tests, not by the app at run time.
 */
import { polyphonic } from 'pinyin-pro';

const cache = new Map<string, readonly string[]>();

export function readingsOf(ch: string): readonly string[] {
  let r = cache.get(ch);
  if (!r) {
    r = (polyphonic(ch, { type: 'array', toneType: 'none' })[0] ?? []).map((s) => s.toLowerCase());
    cache.set(ch, r);
  }
  return r;
}
