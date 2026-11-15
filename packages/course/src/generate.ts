/**
 * Pinyin of example sentences, written into the lesson files by
 * `npm run content:fill` (so a teacher can correct it). pinyin-pro reads the
 * sentence in context (it applies the 一/不 tone changes); multi-character
 * syllabus words and names then take their official reading, which carries
 * the neutral tones (东西 dōngxi, 不客气 bú kèqi).
 */
import { pinyin } from 'pinyin-pro';
import { alignWordPinyin } from './pinyin.ts';
import { readingsOf } from './readings.ts';
import { Segmenter } from './segment.ts';
import type { NameEntry, OfficialWord } from './types.ts';

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);

export class PinyinWriter {
  private readonly readings = new Map<string, string[]>();
  /** Single characters whose syllabus pinyin lists alternatives (谁 shéi/shuí): the first one is preferred. */
  private readonly preferredOf = new Map<string, string[]>();
  private readonly segmenter: Segmenter;

  constructor(vocabulary: readonly OfficialWord[], names: readonly NameEntry[]) {
    for (const w of vocabulary) {
      if ([...w.word].length < 2 || this.readings.has(w.word)) continue;
      const syl = alignWordPinyin(w.word, w.pinyin, readingsOf);
      if (syl) this.readings.set(w.word, syl);
    }
    for (const n of names) this.readings.set(n.zh, n.py.split(' '));
    for (const w of vocabulary) {
      if ([...w.word].length === 1 && w.pinyin.includes('/')) this.preferredOf.set(w.word, w.pinyin.split('/').map((p) => p.trim()));
    }
    this.segmenter = new Segmenter([...vocabulary.map((w) => w.word), ...names.map((n) => n.zh)]);
  }

  /** The preferred form of a syllable for a character (谁: shuí -> shéi). */
  preferred(ch: string, syllable: string): string {
    const alternatives = this.preferredOf.get(ch);
    return alternatives?.includes(syllable) ? alternatives[0]! : syllable;
  }

  /** One lower-case syllable per Han character, separated by spaces. */
  sentence(zh: string): string {
    const chars = [...zh];
    const out: (string | null)[] = chars.map(() => null);
    // Context reading of each run of Han characters.
    for (let i = 0; i < chars.length; ) {
      if (!isHan(chars[i]!)) {
        i++;
        continue;
      }
      let j = i;
      while (j < chars.length && isHan(chars[j]!)) j++;
      const syl = pinyin(chars.slice(i, j).join(''), { type: 'array', toneType: 'symbol' }) as string[];
      syl.forEach((s, k) => (out[i + k] = s.toLowerCase()));
      i = j;
    }
    // Official readings of the words found in the sentence.
    const indexOf = new Map<number, number>();
    let offset = 0;
    chars.forEach((ch, i) => {
      indexOf.set(offset, i);
      offset += ch.length;
    });
    for (const t of this.segmenter.segment(zh)) {
      const official = this.readings.get(t.text);
      if (!official) continue;
      const start = indexOf.get(t.start)!;
      official.forEach((s, k) => (out[start + k] = s));
    }
    return chars
      .map((ch, i) => (isHan(ch) && out[i] ? this.preferred(ch, out[i]) : null))
      .filter((s): s is string => s !== null)
      .join(' ');
  }
}
