import { describe, expect, it } from 'vitest';
import { foldPinyin, foldVi, searchWords, type DictEntry } from '../src/lib/search';

const e = (no: number, word: string, pinyin: string, hanViet: string, meanings?: string[]): DictEntry => ({
  official: { no, level: 1, word, pinyin, syllables: [], pos: [], hanViet },
  content: meanings ? { no, word, meaningsVi: meanings, examples: [], review: { status: 'draft' } } : null,
});
const list = [e(248, '学生', 'xuéshēng', 'học sinh', ['học sinh, sinh viên']), e(152, '女', 'nǚ', 'nữ'), e(107, '老师', 'lǎoshī', 'lão sư', ['giáo viên'])];

describe('dictionary search', () => {
  it('folds tones and diacritics', () => {
    expect(foldVi('Đường Học')).toBe('duong hoc');
    expect(foldPinyin('nǚ’ér')).toBe('nver');
  });
  it('finds by characters, pinyin with or without tones, Hán Việt and meaning', () => {
    const find = (q: string) => searchWords(list, q).map((x) => x.official.word);
    expect(find('学')).toEqual(['学生']);
    expect(find('xuesheng')).toEqual(['学生']);
    expect(find('lǎo shī')).toEqual(['老师']);
    expect(find('nv')).toEqual(['女']);
    expect(find('hoc sinh')).toEqual(['学生']);
    expect(find('giáo')).toEqual(['老师']);
    expect(find('')).toHaveLength(3);
    expect(find('xyz')).toEqual([]);
  });
});
