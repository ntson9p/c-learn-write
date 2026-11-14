import { describe, expect, it } from 'vitest';
import characters from '../data/hsk/characters.json';
import grammar from '../data/hsk/grammar.json';
import vocabulary from '../data/hsk/vocabulary.json';

const count = <T extends { level: number }>(items: T[], level: number) => items.filter((i) => i.level === level).length;

describe('HSK 2025 syllabus data (levels 1-3)', () => {
  it('has the official numbers of words, characters and grammar points', () => {
    expect([1, 2, 3].map((l) => count(vocabulary, l))).toEqual([300, 200, 500]);
    expect([1, 2, 3].map((l) => characters.recognition[String(l) as '1' | '2' | '3'].length)).toEqual([246, 125, 284]);
    expect(Object.fromEntries(Object.entries(characters.handwriting).map(([k, v]) => [k, v.length]))).toEqual({ '2': 100, '3': 150 });
    expect([1, 2, 3].map((l) => count(grammar, l))).toEqual([70, 78, 96]);
  });

  it('numbers words 1-1000 without gaps, in level order', () => {
    expect(vocabulary.map((v) => v.no)).toEqual(Array.from({ length: 1000 }, (_, i) => i + 1));
    expect(vocabulary.every((v, i) => i === 0 || v.level >= vocabulary[i - 1]!.level)).toBe(true);
  });

  it('cuts every pinyin into one syllable per character, with a Hán Việt reading', () => {
    for (const v of vocabulary) {
      expect(v.syllables.length, v.word).toBe([...v.word].length);
      expect(v.hanViet, v.word).toBeTruthy();
    }
  });

  it('keeps word + sense + pinyin unique (还 hái and 还 huán are two words)', () => {
    const keys = vocabulary.map((v) => `${v.word}#${'sense' in v ? v.sense : ''}#${v.pinyin}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
