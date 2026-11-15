import type { Exercise, OfficialWord } from '@c-learn-write/course';
import { describe, expect, it } from 'vitest';
import vocabulary from '../../../packages/course/data/hsk/vocabulary.json';
import lesson1 from '../../../packages/course/data/lessons/hsk1/01.json';
import { check, plainText, shuffle, shuffledTiles, vocabularyDrills } from '../src/lib/exercises';

const exercises = lesson1.exercises as unknown as Exercise[];
const byId = (id: string) => exercises.find((e) => e.id === id)!;
const official = new Map((vocabulary as OfficialWord[]).map((w) => [w.no, w]));

describe('exercise checking', () => {
  it('choice and fill', () => {
    expect(check(byId('hsk1-01-e03'), { type: 'choice', index: 0 })).toMatchObject({ correct: true, score: 100 });
    expect(check(byId('hsk1-01-e03'), { type: 'choice', index: 1 })).toMatchObject({ correct: false, score: 0, expected: '你是学生吗？' });
    expect(check(byId('hsk1-01-e04'), { type: 'fill', text: ' 吗 ' }).correct).toBe(true);
    expect(check(byId('hsk1-01-e04'), { type: 'fill', text: '不' }).correct).toBe(false);
    expect(check(byId('hsk1-01-e04'), { type: 'fill', text: '' }).correct).toBe(false);
  });

  it('order: accepted orders pass; a wrong order is explained by the grader rules when it can', () => {
    expect(check(byId('hsk1-01-e05'), { type: 'order', tiles: ['我', '是', '学生'] }).correct).toBe(true);
    const wrong = check(byId('hsk1-01-e05'), { type: 'order', tiles: ['学生', '是', '我'] });
    expect(wrong).toMatchObject({ correct: false, expected: '我是学生' });
    const placeOrder: Exercise = { id: 'x-e01', type: 'order', vi: 'Tôi ăn cơm ở nhà.', tiles: ['我', '吃饭', '在', '家'], answers: ['我在家吃饭'] };
    const out = check(placeOrder, { type: 'order', tiles: ['我', '吃饭', '在', '家'] });
    expect(out.correct).toBe(false);
    expect(out.issues?.map((i) => i.code)).toEqual(['place_order']);
  });

  it('translate and question go through the grader', () => {
    const good = check(byId('hsk1-01-e08'), { type: 'text', text: '他是老师。' });
    expect(good).toMatchObject({ correct: true, score: 100 });
    const missing = check(byId('hsk1-01-e08'), { type: 'text', text: '他老师。' });
    expect(missing).toMatchObject({ correct: true, score: 85 });
    expect(missing.result?.issues.map((i) => i.code)).toEqual(['missing_word']);
    expect(check(byId('hsk1-01-e08'), { type: 'text', text: '他不是老师。' })).toMatchObject({ correct: false, score: 0 });
    expect(check(byId('hsk1-01-e11'), { type: 'text', text: '是，我是学生。' }).correct).toBe(true);
  });

  it('match scores by mistakes', () => {
    expect(check(byId('hsk1-01-e01'), { type: 'match', mistakes: 0 })).toEqual({ correct: true, score: 100 });
    expect(check(byId('hsk1-01-e01'), { type: 'match', mistakes: 5 })).toEqual({ correct: false, score: 50 });
  });

  it('normalizes text for comparison', () => {
    expect(plainText(' 我 是，學生！')).toBe('我是学生');
  });
});

describe('generated drills', () => {
  it('are reproducible and well formed', () => {
    const words = lesson1.words as never;
    const a = vocabularyDrills('hsk1-01', words, official, { count: 8, listening: true });
    const b = vocabularyDrills('hsk1-01', words, official, { count: 8, listening: true });
    expect(a).toEqual(b);
    expect(a).toHaveLength(8);
    for (const d of a) {
      expect(new Set(d.options).size).toBe(4);
      expect(d.answer).toBeGreaterThanOrEqual(0);
      expect(d.answer).toBeLessThan(4);
    }
    expect(a.some((d) => d.listen)).toBe(true);
    expect(vocabularyDrills('hsk1-01', words, official, { count: 8, listening: false }).some((d) => d.listen)).toBe(false);
  });

  it('shuffles deterministically and never shows tiles already in order', () => {
    expect(shuffle([1, 2, 3, 4, 5], 'x')).toEqual(shuffle([1, 2, 3, 4, 5], 'x'));
    for (const ex of exercises.filter((e) => e.type === 'order')) {
      if (ex.type !== 'order') continue;
      expect(ex.answers).not.toContain(shuffledTiles(ex).join(''));
    }
  });
});
