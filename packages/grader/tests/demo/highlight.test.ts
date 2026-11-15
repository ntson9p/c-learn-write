import { describe, expect, it } from 'vitest';
import { segments } from '../../demo/highlight';
import { QUESTIONS } from '../../questions';
import { grade, type Issue } from '../../src';

const issue = (fields: Partial<Issue>): Issue => ({
  code: 'x',
  severity: 'error',
  penalty: 10,
  message: 'm',
  start: 0,
  end: 0,
  ...fields,
});

describe('segments', () => {
  it('returns the plain text when there is nothing to mark', () => {
    expect(segments('有四个', [])).toEqual([{ kind: 'text', text: '有四个' }]);
    expect(segments('', [])).toEqual([]);
  });

  it('marks spans and insertion points', () => {
    const result = segments('有四本苹果', [
      issue({ start: 2, end: 3, message: 'wrong' }),
      issue({ start: 1, end: 1, message: 'missing', fix: { start: 1, end: 1, replacement: '个' } }),
    ]);
    expect(result).toEqual([
      { kind: 'text', text: '有' },
      { kind: 'insert', messages: ['missing'] },
      { kind: 'text', text: '四' },
      { kind: 'mark', text: '本', severity: 'error', messages: ['wrong'] },
      { kind: 'text', text: '苹果' },
    ]);
  });

  it('merges overlapping issues and skips info notes', () => {
    const result = segments('苹果绿', [
      issue({ start: 0, end: 3, message: 'order' }),
      issue({ start: 0, end: 1, severity: 'typo', message: 'typo' }),
      issue({ start: 0, end: 0, severity: 'info', message: 'info' }),
    ]);
    expect(result).toEqual([
      { kind: 'mark', text: '苹', severity: 'error', messages: ['order', 'typo'] },
      { kind: 'mark', text: '果绿', severity: 'error', messages: ['order'] },
    ]);
  });

  it('keeps every character of every sample answer', () => {
    for (const q of QUESTIONS) {
      for (const ex of q.examples ?? []) {
        const result = grade(q, ex.answer);
        const text = segments(result.normalized, result.issues)
          .map((s) => (s.kind === 'insert' ? '' : s.text))
          .join('');
        expect(text).toBe(result.normalized);
      }
    }
  });
});
