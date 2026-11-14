import { QUESTIONS } from '@c-learn-write/grader/questions';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import GraderPage from '../src/pages/grader';
import { T } from '../src/strings';

describe('grader page ("Chấm thử")', () => {
  it('lists the 9 sample questions', () => {
    render(<GraderPage params={{}} />);
    const group = screen.getByRole('group', { name: T.grader.questions });
    expect(within(group).getAllByRole('button')).toHaveLength(9);
    expect(QUESTIONS).toHaveLength(9);
  });

  // Same expectations as the grader's own example tests, but through the UI.
  for (const q of QUESTIONS) {
    it(`gives every example of ${q.id} its expected score`, () => {
      render(<GraderPage params={{}} />);
      fireEvent.click(within(screen.getByRole('group', { name: T.grader.questions })).getByText(q.title ?? q.prompt));
      const input = screen.getByLabelText(T.grader.answerLabel) as HTMLInputElement;
      for (const ex of q.examples ?? []) {
        fireEvent.input(input, { target: { value: ex.answer } });
        fireEvent.submit(input.form!);
        const result = screen.getByTestId('grade-result');
        expect(result.querySelector('.score-value')?.textContent, ex.answer).toBe(String(ex.score));
        expect(result.querySelector('.expected')?.className).toContain('same');
      }
    });
  }
});
