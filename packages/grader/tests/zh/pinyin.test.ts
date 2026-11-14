import { describe, expect, it } from 'vitest';
import { isHomophone, pinyinOf, readings } from '../../src/lang/zh/pinyin';

describe('pinyin helpers', () => {
  it('lists every reading of a character', () => {
    expect(readings('长')).toEqual(expect.arrayContaining(['chang', 'zhang']));
    expect(readings('a')).toEqual([]);
  });

  it('detects homophones, ignoring tones', () => {
    expect(isHomophone('平', '苹')).toBe(true);
    expect(isHomophone('是', '十')).toBe(true);
    expect(isHomophone('那', '哪')).toBe(true);
    expect(isHomophone('南', '喃')).toBe(true);
    expect(isHomophone('苹', '苹')).toBe(false);
    expect(isHomophone('苹', '芒')).toBe(false);
    expect(isHomophone('a', 'a')).toBe(false);
  });

  it('writes pinyin with tone marks', () => {
    expect(pinyinOf('苹果')).toBe('píng guǒ');
  });
});
