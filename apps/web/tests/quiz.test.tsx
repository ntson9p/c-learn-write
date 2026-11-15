import type { Exercise } from '@c-learn-write/course';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { answer } from './solve';
import { beforeEach, describe, expect, it } from 'vitest';
import lesson1 from '../../../packages/course/data/lessons/hsk1/01.json';
import { clearAll } from '../src/lib/db';
import { allLessonProgress } from '../src/lib/progress';
import { allResults } from '../src/lib/results';
import QuizPage, { QUIZ_SIZE, quizExercises } from '../src/pages/quiz';
import { T } from '../src/strings';

const exercises = lesson1.exercises as unknown as Exercise[];

describe('lesson quiz', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('selects the same questions for the same attempt, without matching', () => {
    const a = quizExercises('hsk1-01', exercises, 0);
    expect(a).toEqual(quizExercises('hsk1-01', exercises, 0));
    expect(a).toHaveLength(Math.min(QUIZ_SIZE, exercises.filter((e) => e.type !== 'match').length));
    expect(a.some((e) => e.type === 'match')).toBe(false);
  });

  it('passes with right answers through the UI and completes the lesson', async () => {
    render(<QuizPage params={{ id: 'hsk1-01' }} />);
    fireEvent.click(await screen.findByRole('button', { name: T.quiz.start }));
    for (const ex of quizExercises('hsk1-01', exercises, 0)) {
      await answer(ex, true);
      expect(document.querySelector('.feedback')?.className).toContain('good');
      fireEvent.click(screen.getByRole('button', { name: T.exercise.next }));
    }
    const result = await screen.findByTestId('quiz-result');
    expect(result.textContent).toContain(T.quiz.result(100));
    await waitFor(async () => expect((await allLessonProgress()).get('hsk1-01')?.completedAt).not.toBeNull());
    expect((await allResults())[0]).toMatchObject({ kind: 'lesson', lessonId: 'hsk1-01', score: 100, weakGrammar: [] });
  });

  it('fails with wrong answers and lists the grammar to review', async () => {
    render(<QuizPage params={{ id: 'hsk1-01' }} />);
    fireEvent.click(await screen.findByRole('button', { name: T.quiz.start }));
    for (const ex of quizExercises('hsk1-01', exercises, 0)) {
      await answer(ex, false);
      fireEvent.click(screen.getByRole('button', { name: T.exercise.next }));
    }
    const result = await screen.findByTestId('quiz-result');
    expect(result.textContent).toContain(T.quiz.failed);
    expect(result.querySelectorAll('a[href^="#/grammar/"]').length).toBeGreaterThan(0);
    expect((await allLessonProgress()).get('hsk1-01')?.completedAt ?? null).toBeNull();
  });
});
