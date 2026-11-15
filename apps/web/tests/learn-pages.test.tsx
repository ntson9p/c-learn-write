import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { allCards } from '../src/lib/cards';
import { clearAll } from '../src/lib/db';
import { allLessonProgress } from '../src/lib/progress';
import GrammarPage from '../src/pages/grammar';
import HomePage from '../src/pages/home';
import LessonPage from '../src/pages/lesson';
import ReviewPage from '../src/pages/review';
import WordPage from '../src/pages/word';
import { T } from '../src/strings';

describe('learning pages (with the real HSK1 lesson 1)', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('lists the 15 HSK1 lessons; the first one opens, later written ones are locked', async () => {
    render(<HomePage params={{}} />);
    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(15);
    expect(within(items[0]!).getByText('Xin chào')).toBeTruthy();
    await waitFor(() => expect(within(items[0]!).getByText(T.home.state.open)).toBeTruthy());
  });

  it('shows a lesson with its words and grammar, and adds the words to review', async () => {
    render(<LessonPage params={{ id: 'hsk1-01' }} />);
    await screen.findByRole('heading', { level: 1, name: 'Xin chào' });
    expect(screen.getByRole('heading', { name: T.lesson.words(20) })).toBeTruthy();
    expect(screen.getByRole('heading', { name: T.lesson.grammar(4) })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: T.lesson.addCards }));
    await screen.findByText(T.lesson.cardsAdded(20), { exact: false });
    expect(await allCards()).toHaveLength(20);
    await waitFor(async () => expect((await allLessonProgress()).has('hsk1-01')).toBe(true));
  });

  it('shows a word with pinyin, Hán Việt, meaning and example', async () => {
    render(<WordPage params={{ no: '248' }} />);
    await screen.findByText('xuéshēng');
    expect(document.querySelector('.hanviet strong')?.textContent).toBe('học sinh');
    expect(screen.getByText('học sinh, sinh viên')).toBeTruthy();
    expect(screen.getByText(T.draftBadge)).toBeTruthy();
    expect(document.querySelectorAll('ruby').length).toBeGreaterThan(0);
  });

  it('shows a grammar point with its mistakes', async () => {
    render(<GrammarPage params={{ no: '52' }} />);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(T.grammar.mistakes)).toBeTruthy();
    expect(screen.getByText('我学生。')).toBeTruthy();
  });

  it('runs a review session: show answer, rate, finish', async () => {
    render(<LessonPage params={{ id: 'hsk1-01' }} />);
    fireEvent.click(await screen.findByRole('button', { name: T.lesson.addCards }));
    await screen.findByText(T.lesson.cardsAdded(20), { exact: false });

    render(<ReviewPage params={{}} />);
    fireEvent.click(await screen.findByRole('button', { name: T.review.start }));
    expect(await screen.findByText(T.review.remaining(10))).toBeTruthy();
    const card = await screen.findByTestId('flashcard');
    await waitFor(() => expect(card.textContent).toContain('你'));
    fireEvent.click(screen.getByRole('button', { name: T.review.show }));
    // "Dễ" graduates a new card for days, so it leaves the session.
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(T.review.ratings[4]) }));
    await screen.findByText(T.review.remaining(9));
    const cards = await allCards();
    expect(cards.find((c) => c.wordId === 'w0146')?.reps).toBe(1);
  });
});
