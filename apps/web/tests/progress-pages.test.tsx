import type { Exercise, OfficialWord } from '@c-learn-write/course';
import { render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import vocabulary from '../../../packages/course/data/hsk/vocabulary.json';
import lesson1 from '../../../packages/course/data/lessons/hsk1/01.json';
import { addCards } from '../src/lib/cards';
import { clearAll } from '../src/lib/db';
import { recordQuiz } from '../src/lib/progress';
import { addResult } from '../src/lib/results';
import GuidePage from '../src/pages/guide';
import { LEVEL_TEST_SIZE, levelTestItems } from '../src/pages/level-test';
import ProgressPage from '../src/pages/progress';
import { T } from '../src/strings';

const official = new Map((vocabulary as OfficialWord[]).map((w) => [w.no, w]));
const lesson = { id: 'hsk1-01', exercises: lesson1.exercises as unknown as Exercise[], words: lesson1.words as never };

describe('progress and level test', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('builds a reproducible level test from written lessons', () => {
    const a = levelTestItems(1, [lesson], official, 0, true);
    expect(a).toEqual(levelTestItems(1, [lesson], official, 0, true));
    expect(a.length).toBeLessThanOrEqual(LEVEL_TEST_SIZE);
    expect(a.some((e) => e.type === 'match')).toBe(false);
    expect(new Set(a.map((e) => e.id)).size).toBe(a.length);
    expect(levelTestItems(1, [lesson], official, 1, true)).not.toEqual(a);
  });

  it('shows statistics, completed lessons, results and weak grammar', async () => {
    const now = new Date();
    await addCards(['w0146', 'w0221'], now);
    await recordQuiz('hsk1-01', 90, now);
    await addResult({ kind: 'lesson', level: 1, lessonId: 'hsk1-01', score: 90, at: now.getTime(), durationMs: 1000, weakGrammar: ['52'] });
    render(<ProgressPage params={{}} />);
    await screen.findByText(T.progress.levelLessons(1, 1, 15));
    expect(screen.getByText(T.progress.streak(1))).toBeTruthy();
    expect(screen.getByText(T.progress.resultLine('lesson', 'hsk1-01 Xin chào', 90))).toBeTruthy();
    await waitFor(() => expect(screen.getByText(T.progress.weak)).toBeTruthy());
    const values = [...document.querySelectorAll('.stat-value')].map((e) => e.textContent);
    expect(values[0]).toBe('2');
  });

  it('shows the setup guide', () => {
    render(<GuidePage params={{}} />);
    expect(screen.getByRole('heading', { level: 1, name: T.guide.title })).toBeTruthy();
    expect(screen.getAllByText('iPhone, iPad')).toHaveLength(2);
  });
});
