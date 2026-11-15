import type { Exercise, Level } from '@c-learn-write/course';
import { useState } from 'preact/hooks';
import type { AnyExercise } from '../components/exercise';
import { useAsync } from '../components/hooks';
import type { PageProps } from '../components/lazy';
import { ExerciseRun, type Answered } from '../components/run';
import { zhRuns } from '../components/text';
import { lessonsOf, officialWords } from '../lib/content';
import { shuffle, vocabularyDrills } from '../lib/exercises';
import { addResult, averageScore, resultsFor, weakGrammar } from '../lib/results';
import { voices } from '../lib/speech';
import { href } from '../router';
import { T } from '../strings';

export const LEVEL_TEST_SIZE = 25;

/**
 * A level test: vocabulary drills over the level's words and authored
 * exercises from every written lesson (no matching), with a seed per attempt.
 */
export function levelTestItems(
  level: number,
  lessons: readonly { id: string; exercises: readonly Exercise[]; words: Parameters<typeof vocabularyDrills>[1] }[],
  official: Parameters<typeof vocabularyDrills>[2],
  attempt: number,
  listening: boolean,
): AnyExercise[] {
  const seed = `hsk${level}#test#${attempt}`;
  const words = lessons.flatMap((l) => l.words);
  const drills = vocabularyDrills(`hsk${level}-test-${attempt}`, words, official, { count: 8, listening });
  const authored = shuffle(
    lessons.flatMap((l) => l.exercises.filter((e) => e.type !== 'match')),
    seed,
  ).slice(0, LEVEL_TEST_SIZE - drills.length);
  return shuffle([...drills, ...authored], `${seed}#mix`);
}

export default function LevelTestPage({ params }: PageProps) {
  const level = Number(params.level) as Level;
  const data = useAsync(async () => {
    if (![1, 2, 3].includes(level)) return null;
    const lessons = await lessonsOf(level);
    const past = await resultsFor('level', { level });
    return { lessons, official: await officialWords(), attempt: past.length };
  }, [level]);
  const [started, setStarted] = useState(0);
  const [score, setScore] = useState<{ value: number; weak: number[] } | null>(null);

  if (data.loading) return <p class="loading">{T.loading}</p>;
  const d = data.data;
  if (!d) return <p class="card">{T.notFound}</p>;
  const written = d.lessons.filter((l) => l.content).map((l) => ({ id: l.meta.id, exercises: l.content!.exercises, words: l.content!.words }));
  const grammarTitle = new Map(d.lessons.flatMap((l) => l.content?.grammar ?? []).map((g) => [g.no, g.titleVi]));
  const items = written.length > 0 ? levelTestItems(level, written, d.official, d.attempt, voices.value.length > 0) : [];

  const finish = async (answers: Answered[]) => {
    const value = averageScore(answers.map((a) => a.outcome.score));
    const weak = weakGrammar(answers.map((a) => ({ correct: a.outcome.correct, grammar: 'grammar' in a.exercise ? a.exercise.grammar : undefined })));
    await addResult({ kind: 'level', level, score: value, at: Date.now(), durationMs: Date.now() - started, weakGrammar: weak.map(String) });
    setScore({ value, weak });
  };

  return (
    <section class="page level-test-page">
      <h1>{T.levelTest.title(level)}</h1>
      {written.length === 0 ? (
        <p class="card">{T.levelTest.none}</p>
      ) : score ? (
        <div class="card" data-testid="level-result">
          <p class="score-line">{T.levelTest.result(score.value)}</p>
          <p>{score.value >= 90 ? T.levelTest.good : score.value >= 60 ? T.levelTest.fair : T.levelTest.poor}</p>
          {score.weak.length > 0 && (
            <ul class="link-list">
              {score.weak.map((no) => (
                <li key={no}>
                  <a href={href(`/grammar/${no}`)}>{zhRuns(grammarTitle.get(no) ?? `#${no}`)}</a>
                </li>
              ))}
            </ul>
          )}
          <a class="button" href={href('/progress')}>
            {T.progress.title}
          </a>
        </div>
      ) : !started ? (
        <div class="card">
          <p>{T.levelTest.intro(items.length, written.length)}</p>
          {written.length < d.lessons.length && <p class="muted">{T.levelTest.partial}</p>}
          <button type="button" class="button primary" onClick={() => setStarted(Date.now())}>
            {T.levelTest.start}
          </button>
        </div>
      ) : (
        <ExerciseRun exercises={items} onFinish={(a) => void finish(a)} />
      )}
    </section>
  );
}
