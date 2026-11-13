import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../questions';
import { grade, validateQuestion } from '../src';
import { LOCALIZERS, NOUNS, PLACES } from '../src/lang/zh/lexicon';

describe('sample questions', () => {
  it('are loaded', () => {
    expect(QUESTIONS.length).toBe(9);
  });

  it('have unique ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const q of QUESTIONS) {
    describe(q.id, () => {
      it('is a valid question', () => {
        expect(validateQuestion(q)).toEqual([]);
      });

      if (q.type === 'count') {
        it('counts a noun from the lexicon', () => {
          expect(NOUNS.has(q.expected.noun)).toBe(true);
        });
        it('gives 100 to its own model sentence', () => {
          expect(grade(q, q.expected.sentence ?? '').score).toBe(100);
        });
      }

      if (q.type === 'location') {
        it('uses places and a localizer from the lexicon', () => {
          for (const place of q.expected.places ?? []) expect(PLACES.has(place), place).toBe(true);
          if (q.expected.localizer) expect(LOCALIZERS.has(q.expected.localizer)).toBe(true);
        });
        it('gives 100 to its own model sentence', () => {
          expect(grade(q, q.expected.sentence ?? '').score).toBe(100);
        });
      }

      // Each example is a regression test. Without an explicit "issues"
      // list, a 100-point answer must have no issue at all.
      for (const ex of q.examples ?? []) {
        it(`${ex.answer} -> ${ex.score}`, () => {
          const result = grade(q, ex.answer);
          const codes = result.issues.map((i) => i.code).sort();
          const expectedCodes = ex.issues ? [...ex.issues].sort() : ex.score === 100 ? [] : codes;
          expect({ score: result.score, issues: codes }).toEqual({ score: ex.score, issues: expectedCodes });
        });
      }
    });
  }
});
