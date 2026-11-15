import { describe, expect, it } from 'vitest';
import { validateQuestion } from '../../src/core/validate';

const base = { id: 'q1', lang: 'zh', prompt: '书在哪儿？' };

describe('validateQuestion', () => {
  it('accepts valid questions of every type', () => {
    expect(validateQuestion({ ...base, type: 'count', expected: { number: 4, noun: '苹果' } })).toEqual([]);
    expect(validateQuestion({ ...base, type: 'model', answers: ['(我)是越南人'] })).toEqual([]);
    expect(validateQuestion({ ...base, type: 'location', expected: { places: ['书包'], localizer: '里' } })).toEqual([]);
    expect(validateQuestion({ ...base, type: 'location', expected: { sentence: '我在家吃饭。' } })).toEqual([]);
  });

  it('reports problems with their question id', () => {
    expect(validateQuestion('nope')).toEqual(['question must be an object']);
    expect(validateQuestion({ ...base, type: 'quiz' })).toEqual(['q1: "type" must be one of count, model, location']);
    expect(validateQuestion({ ...base, type: 'count', expected: { number: -1, noun: '' } })).toEqual([
      'q1: "expected.number" must be an integer >= 0',
      'q1: "expected.noun" must be a non-empty string',
    ]);
  });

  it('checks location questions', () => {
    expect(validateQuestion({ ...base, type: 'location' })).toEqual(['q1: "expected" must be an object']);
    expect(validateQuestion({ ...base, type: 'location', expected: { places: [] } })).toEqual([
      'q1: "expected.places" must be a non-empty array of non-empty strings',
    ]);
    expect(validateQuestion({ ...base, type: 'location', expected: { localizer: '里' } })).toEqual([
      'q1: "expected.localizer" needs "expected.places"',
    ]);
    expect(
      validateQuestion({ ...base, type: 'location', expected: { places: ['书包'] }, options: { wrongContentScore: 120 } }),
    ).toEqual(['q1: "options.wrongContentScore" must be an integer from 0 to 100']);
  });

  it('checks model answer patterns', () => {
    const errors = validateQuestion({ ...base, type: 'model', answers: ['[这|那是苹果'] });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Missing "]"');
  });

  it('checks examples', () => {
    expect(
      validateQuestion({
        ...base,
        type: 'count',
        expected: { number: 4, noun: '苹果' },
        examples: [{ answer: '有四个', score: 101 }],
      }),
    ).toEqual(['q1: example 0: "score" must be an integer from 0 to 100']);
  });
});
