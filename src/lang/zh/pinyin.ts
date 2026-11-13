import { pinyin, polyphonic } from 'pinyin-pro';
import { isHan } from './chars';

const readingCache = new Map<string, readonly string[]>();

/** All toneless readings of one character (长 -> ["chang", "zhang"]). */
export function readings(ch: string): readonly string[] {
  let cached = readingCache.get(ch);
  if (!cached) {
    cached = isHan(ch) ? (polyphonic(ch, { type: 'array', toneType: 'none' })[0] ?? []).map((r) => r.toLowerCase()) : [];
    readingCache.set(ch, cached);
  }
  return cached;
}

/**
 * True when two different characters can be read the same way, ignoring
 * tones (平/苹, 是/十, 那/哪). These are the typical mistakes made when typing
 * with a pinyin input method.
 */
export function isHomophone(a: string, b: string): boolean {
  if (a === b) return false;
  const ra = readings(a);
  const rb = readings(b);
  return ra.length > 0 && ra.some((r) => rb.includes(r));
}

/** Pinyin with tone marks, syllables separated by spaces. */
export function pinyinOf(text: string): string {
  return pinyin(text, { toneType: 'symbol' });
}
