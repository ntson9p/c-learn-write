/** "Chấm thử": try the grader on its sample questions (the grader used as a library). */
import { grade, type GradeResult, type Question } from '@c-learn-write/grader';
import { QUESTIONS } from '@c-learn-write/grader/questions';
import { useState } from 'preact/hooks';
import { GradeResultView, scoreBand } from '../components/grade-result';
import type { PageProps } from '../components/lazy';
import { T } from '../strings';

export default function GraderPage(_props: PageProps) {
  const [current, setCurrent] = useState<Question>(QUESTIONS[0]!);
  const [answer, setAnswer] = useState('');
  const [graded, setGraded] = useState<{ answer: string; result: GradeResult } | null>(null);

  const check = (text: string) => setGraded({ answer: text, result: grade(current, text) });
  const example = graded ? current.examples?.find((ex) => ex.answer === graded.answer) : undefined;

  return (
    <section class="page grader-page">
      <h1>{T.grader.title}</h1>
      <p class="lead">{T.grader.intro}</p>

      <h2 class="label">{T.grader.questions}</h2>
      <div class="chips" role="group" aria-label={T.grader.questions}>
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            type="button"
            class={q.id === current.id ? 'chip active' : 'chip'}
            aria-pressed={q.id === current.id}
            onClick={() => {
              setCurrent(q);
              setAnswer('');
              setGraded(null);
            }}
          >
            {q.title ?? q.prompt}
          </button>
        ))}
      </div>

      <div class="card question">
        {current.picture && (
          <div class="picture" aria-hidden="true">
            {current.picture}
          </div>
        )}
        <div>
          <p class="prompt zh" lang="zh-CN">
            {current.prompt}
          </p>
          {current.promptVi && <p class="prompt-vi">{current.promptVi}</p>}
        </div>
      </div>

      <form
        class="answer-form"
        autocomplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          check(answer);
        }}
      >
        <label for="grader-answer" class="visually-hidden">
          {T.grader.answerLabel}
        </label>
        <input
          id="grader-answer"
          type="text"
          lang="zh-CN"
          value={answer}
          placeholder={T.grader.placeholder}
          onInput={(e) => setAnswer((e.target as HTMLInputElement).value)}
        />
        <button type="submit" class="button primary">
          {T.grader.submit}
        </button>
      </form>

      {(current.examples?.length ?? 0) > 0 && (
        <>
          <h2 class="label">{T.grader.tryExamples}</h2>
          <div class="chips">
            {current.examples!.map((ex) => (
              <button
                key={ex.answer}
                type="button"
                class="chip example"
                lang="zh-CN"
                title={ex.note}
                onClick={() => {
                  setAnswer(ex.answer);
                  check(ex.answer);
                }}
              >
                <span>{ex.answer}</span>
                <span class={`badge ${scoreBand(ex.score)}`}>{ex.score}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {graded && (
        <div class="card result" aria-live="polite" data-testid="grade-result">
          <GradeResultView result={graded.result} />
          {example && (
            <p class={`line expected ${example.score === graded.result.score ? 'same' : 'different'}`}>
              {T.grader.expected(example.score, example.score === graded.result.score, graded.result.score)}
              {example.note ? ` · ${example.note}` : ''}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
