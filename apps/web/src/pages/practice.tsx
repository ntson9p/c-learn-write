import type { Exercise } from '@c-learn-write/course';
import { useState } from 'preact/hooks';
import type { AnyExercise } from '../components/exercise';
import { useAsync } from '../components/hooks';
import type { PageProps } from '../components/lazy';
import { ExerciseRun, type Answered } from '../components/run';
import { findLesson, officialWords } from '../lib/content';
import { vocabularyDrills } from '../lib/exercises';
import { recordExercise } from '../lib/progress';
import { voices } from '../lib/speech';
import { href } from '../router';
import { T } from '../strings';

export default function PracticePage({ params }: PageProps) {
  const id = params.id ?? '';
  const data = useAsync(async () => ({ lesson: await findLesson(id), words: await officialWords() }), [id]);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<Answered[] | null>(null);

  if (data.loading) return <p class="loading">{T.loading}</p>;
  const lesson = data.data?.lesson;
  if (!lesson?.content) return <p class="card">{T.lesson.notFound}</p>;
  const content = lesson.content;
  const drills = vocabularyDrills(id, content.words, data.data!.words, { count: 8, listening: voices.value.length > 0 });
  const list: AnyExercise[] = [...drills, ...content.exercises];
  const authored = new Set(content.exercises.map((e: Exercise) => e.id));

  return (
    <section class="page practice-page">
      <p class="muted">
        <a href={href(`/lesson/${id}`)}>{T.practice.backToLesson}</a>
      </p>
      <h1>{T.practice.title(lesson.meta.titleVi)}</h1>
      {result ? (
        <div class="card">
          <p class="notice ok" role="status">
            {T.practice.done(result.filter((a) => a.outcome.correct).length, result.length)}
          </p>
          <div class="button-row">
            <button type="button" class="button" onClick={() => (setResult(null), setRun((r) => r + 1))}>
              {T.practice.again}
            </button>
            <a class="button primary" href={href(`/quiz/${id}`)}>
              {T.practice.toQuiz}
            </a>
          </div>
        </div>
      ) : (
        <ExerciseRun
          key={run}
          exercises={list}
          onAnswer={(a) => {
            if (authored.has(a.exercise.id)) {
              void recordExercise(id, a.exercise.id, { correct: a.outcome.correct, score: a.outcome.score, at: Date.now() }, new Date());
            }
          }}
          onFinish={setResult}
        />
      )}
    </section>
  );
}
