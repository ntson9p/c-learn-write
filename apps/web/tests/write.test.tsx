import { render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAll } from '../src/lib/db';
import { recordWriting, strokeUrl, writingRecords } from '../src/lib/writing';
import WritePage from '../src/pages/write';
import { T } from '../src/strings';

describe('handwriting', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('lists the 100 HSK2 and 150 HSK3 handwriting characters, marking practised ones', async () => {
    await recordWriting('爱', 1, new Date());
    render(<WritePage params={{}} />);
    await screen.findByRole('heading', { name: T.writing.level(2, 100) });
    expect(screen.getByRole('heading', { name: T.writing.level(3, 150) })).toBeTruthy();
    expect(document.querySelectorAll('.char-cell')).toHaveLength(250);
    expect(document.querySelectorAll('.char-cell.done')).toHaveLength(1);
  });

  it('keeps the best result per character', async () => {
    await recordWriting('八', 3, new Date());
    await recordWriting('八', 1, new Date());
    await recordWriting('八', 2, new Date());
    expect((await writingRecords())['八']).toMatchObject({ done: 3, best: 1 });
    expect(strokeUrl('爱')).toBe('./strokes/7231.json');
  });
});
