import { expandPattern } from '@c-learn-write/grader';
import { fireEvent, screen, within } from '@testing-library/preact';
import type { AnyExercise } from '../src/components/exercise';
import { T } from '../src/strings';

/** Answers the exercise on screen, rightly or wrongly, through the UI. */
export async function answer(ex: AnyExercise, right: boolean) {
  const area = document.querySelector('.exercise') as HTMLElement;
  const ui = within(area);
  switch (ex.type) {
    case 'choice': {
      const text = ex.options[right ? ex.answer : (ex.answer + 1) % ex.options.length]!;
      // (happy-dom inserts spaces in accessible names of mixed-language content: match the text instead)
      fireEvent.click(ui.getAllByRole('radio').find((r) => r.textContent === text)!);
      break;
    }
    case 'fill': {
      if (ex.options) fireEvent.click(ui.getByRole('button', { name: right ? ex.answers[0]! : ex.options.find((o) => !ex.answers.includes(o))! }));
      else {
        fireEvent.input(ui.getByRole('textbox'), { target: { value: right ? ex.answers[0] : '错' } });
        fireEvent.click(ui.getByRole('button', { name: T.exercise.check }));
      }
      break;
    }
    case 'order': {
      // Build the first accepted answer from the shuffled pool, tile by tile.
      let rest = right ? ex.answers[0]! : [...ex.tiles].reverse().join('');
      while (rest) {
        const pool = [...area.querySelectorAll('.tile-pool .tile')] as HTMLButtonElement[];
        const tile = pool.find((b) => rest.startsWith(b.textContent!))!;
        fireEvent.click(tile);
        rest = rest.slice(tile.textContent!.length);
      }
      fireEvent.click(ui.getByRole('button', { name: T.exercise.check }));
      break;
    }
    case 'translate':
    case 'question': {
      const first = ex.type === 'translate' ? ex.answers[0]! : (ex.question as { answers?: (string | { text: string })[] }).answers?.[0];
      const text = right ? expandPattern(typeof first === 'string' ? first : first!.text)[0]! : '我喜欢苹果。';
      fireEvent.input(ui.getByRole('textbox'), { target: { value: text } });
      fireEvent.submit(ui.getByRole('textbox').closest('form')!);
      break;
    }
    case 'match': {
      for (const [left, rightSide] of ex.pairs) {
        fireEvent.click(ui.getAllByRole('button').find((b) => b.textContent === left)!);
        fireEvent.click(ui.getAllByRole('button').find((b) => b.textContent === rightSide)!);
      }
      break;
    }
  }
  await screen.findByRole('button', { name: T.exercise.next });
}

