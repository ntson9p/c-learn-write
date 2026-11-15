import { describe, expect, it } from 'vitest';
import { alignWordPinyin, isPinyinLetter, numbered, stripTones, toneOf } from '../src/pinyin';
import { readingsOf } from '../src/readings';

describe('pinyin helpers', () => {
  it('reads tones', () => {
    expect(['mā', 'má', 'mǎ', 'mà', 'ma', 'lǜ'].map(toneOf)).toEqual([1, 2, 3, 4, 5, 4]);
    expect(stripTones('Lǜ')).toBe('lü');
    expect(numbered('nǚ')).toBe('nü3');
    expect(isPinyinLetter('ǚ')).toBe(true);
    expect(isPinyinLetter('’')).toBe(false);
  });

  it('cuts written pinyin into one syllable per character', () => {
    const cut = (w: string, p: string) => alignWordPinyin(w, p, readingsOf)?.map(numbered);
    expect(cut('包子', 'bāozi')).toEqual(['bao1', 'zi5']);
    expect(cut('不客气', 'bú kèqi')).toEqual(['bu2', 'ke4', 'qi5']);
    expect(cut('一点儿', 'yìdiǎnr')).toEqual(['yi4', 'dian3', 'r5']);
    expect(cut('女儿', 'nǚ’ér')).toEqual(['nü3', 'er2']);
    expect(cut('红绿灯', 'hóng-lǜdēng')).toEqual(['hong2', 'lü4', 'deng1']);
    expect(cut('谁', 'shéi/shuí')).toEqual(['shei2']);
    expect(cut('西安', 'xī’ān')).toEqual(['xi1', 'an1']);
  });

  it('refuses pinyin that does not fit the characters', () => {
    expect(alignWordPinyin('包子', 'bāo', readingsOf)).toBeNull();
    expect(alignWordPinyin('包子', 'bāozi le', readingsOf)).toBeNull();
    expect(alignWordPinyin('苹果', 'píng guǒ!', readingsOf)).toBeNull();
  });
});
