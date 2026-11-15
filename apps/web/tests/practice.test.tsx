import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAll } from '../src/lib/db';
import { allLessonProgress } from '../src/lib/progress';
import PracticePage from '../src/pages/practice';
import { T } from '../src/strings';
import lesson1 from '../../../packages/course/data/lessons/hsk1/01.json';
import { answer } from './solve';
import { vocabularyDrills } from '../src/lib/exercises';
import { officialWords } from '../src/lib/content';
import type { AnyExercise } from '../src/components/exercise';

describe('practice page', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('runs drills and every exercise of lesson 1, recording authored ones', async () => {
    const drills = vocabularyDrills('hsk1-01', lesson1.words as never, await officialWords(), { count: 8, listening: false });
    const list = [...drills, ...(lesson1.exercises as unknown as AnyExercise[])];
    render(<PracticePage params={{ id: 'hsk1-01' }} />);
    await screen.findByText(T.exercise.progress(1, list.length));
    for (const ex of list) {
      await answer(ex, true);
      expect(document.querySelector('.feedback')?.className, ex.id).toContain('good');
      fireEvent.click(screen.getByRole('button', { name: T.exercise.next }));
    }
    await screen.findByText(T.practice.done(list.length, list.length));
    await waitFor(async () => expect(Object.keys((await allLessonProgress()).get('hsk1-01')?.exercises ?? {})).toHaveLength(lesson1.exercises.length));
  });
});
