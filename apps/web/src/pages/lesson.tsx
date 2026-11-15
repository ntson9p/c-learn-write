import { wordId } from '@c-learn-write/course';
import { useEffect, useState } from 'preact/hooks';
import { useAsync } from '../components/hooks';
import type { PageProps } from '../components/lazy';
import { DraftBadge, zhRuns } from '../components/text';
import { addCards } from '../lib/cards';
import { findLesson, officialWords } from '../lib/content';
import { startLesson } from '../lib/progress';
import { href } from '../router';
import { T } from '../strings';

export default function LessonPage({ params }: PageProps) {
  const id = params.id ?? '';
  const lesson = useAsync(() => findLesson(id), [id]);
  const words = useAsync(officialWords, []);
  const [added, setAdded] = useState<number | null>(null);

  useEffect(() => {
    if (lesson.data?.content) void startLesson(id, new Date());
  }, [lesson.data]);

  if (lesson.loading) return <p class="loading">{T.loading}</p>;
  const l = lesson.data;
  if (!l) return <p class="card">{T.lesson.notFound}</p>;
  const { meta, content } = l;

  return (
    <section class="page lesson-page">
      <p class="muted">{T.lessonLabel(meta.level, meta.order)}</p>
      <h1>{meta.titleVi}</h1>
      <p class="lead">{meta.topicVi}</p>
      {!content ? (
        <p class="card">{T.lesson.writing}</p>
      ) : (
        <>
          <div class="card">
            <h2>{T.lesson.goals}</h2>
            <ul>
              {content.goalsVi.map((g) => (
                <li key={g}>{zhRuns(g)}</li>
              ))}
            </ul>
          </div>

          <div class="card">
            <h2>{T.lesson.words(content.words.length)}</h2>
            <ul class="word-grid">
              {content.words.map((w) => {
                const official = words.data?.get(w.no);
                return (
                  <li key={w.no}>
                    <a class="word-chip" href={href(`/word/${w.no}`)}>
                      <span class="zh hanzi" lang="zh-CN">
                        {w.word}
                      </span>
                      <span class="pinyin">{official?.pinyin}</span>
                      <span class="meaning">{w.meaningsVi[0]}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              class="button primary"
              onClick={async () => setAdded(await addCards(content.words.map((w) => wordId(w.no)), new Date()))}
            >
              {T.lesson.addCards}
            </button>
            {added !== null && (
              <p class="notice ok" role="status">
                {T.lesson.cardsAdded(added)} <a href={href('/review')}>{T.review.start}</a>
              </p>
            )}
          </div>

          <div class="card">
            <h2>{T.lesson.grammar(content.grammar.length)}</h2>
            <ul class="link-list grammar-list">
              {content.grammar.map((g) => (
                <li key={g.no}>
                  <a href={href(`/grammar/${g.no}`)}>{zhRuns(g.titleVi)}</a> <DraftBadge item={g} />
                  <div class="muted">{zhRuns(g.summaryVi)}</div>
                </li>
              ))}
            </ul>
          </div>

          <div class="card">
            <h2>{T.lesson.practice}</h2>
            <p>{T.lesson.practiceIntro(content.exercises.length)}</p>
            <a class="button primary" href={href(`/practice/${meta.id}`)}>
              {T.lesson.startPractice}
            </a>
          </div>

          <div class="card">
            <h2>{T.lesson.quiz}</h2>
            <p>{T.lesson.quizIntro}</p>
            <a class="button" href={href(`/quiz/${meta.id}`)}>
              {T.lesson.startQuiz}
            </a>
          </div>
        </>
      )}
    </section>
  );
}
