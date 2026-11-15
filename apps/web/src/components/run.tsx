/** Runs a list of exercises one by one and reports every outcome. */
import { useState } from 'preact/hooks';
import type { Outcome } from '../lib/exercises';
import { T } from '../strings';
import { ExerciseView, type AnyExercise } from './exercise';

export interface Answered {
  exercise: AnyExercise;
  outcome: Outcome;
}

export function ExerciseRun({ exercises, onFinish, onAnswer }: { exercises: AnyExercise[]; onFinish: (answers: Answered[]) => void; onAnswer?: (a: Answered) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const ex = exercises[index];
  if (!ex) return null;
  const checked = answers.length > index;
  return (
    <div class="run">
      <p class="muted" aria-live="polite">
        {T.exercise.progress(index + 1, exercises.length)}
      </p>
      <div class="progress-bar" aria-hidden="true">
        <span style={{ width: `${(100 * index) / exercises.length}%` }} />
      </div>
      <div class="card">
        <ExerciseView
          key={ex.id}
          exercise={ex}
          onChecked={(outcome) => {
            const a = { exercise: ex, outcome };
            setAnswers((list) => [...list, a]);
            onAnswer?.(a);
          }}
        />
      </div>
      {checked && (
        <button
          type="button"
          class="button primary wide"
          autoFocus
          onClick={() => {
            if (index + 1 >= exercises.length) onFinish(answers);
            else setIndex(index + 1);
          }}
        >
          {T.exercise.next}
        </button>
      )}
    </div>
  );
}
