import { loadGrammarList } from '@c-learn-write/course';
import type { PageProps } from '../components/lazy';
import { useAsync } from '../components/hooks';
import { SpeakButton } from '../components/speak';
import { DraftBadge, Pinyin, RichText, zhRuns } from '../components/text';
import { findGrammar } from '../lib/content';
import { href } from '../router';
import { T } from '../strings';

export default function GrammarPage({ params }: PageProps) {
  const no = Number(params.no);
  const found = useAsync(() => findGrammar(no), [no]);
  const official = useAsync(async () => (await loadGrammarList()).find((g) => g.no === no), [no]);
  if (found.loading) return <p class="loading">{T.loading}</p>;
  const f = found.data;
  if (!f) return <p class="card">{T.grammar.notFound}</p>;
  const g = f.content;
  const o = official.data;

  return (
    <section class="page grammar-page">
      <p class="muted">
        <a href={href(`/lesson/${f.lesson.meta.id}`)}>
          {T.lessonLabel(f.lesson.meta.level, f.lesson.meta.order)} — {f.lesson.meta.titleVi}
        </a>
      </p>
      {!g ? (
        <p class="card">{T.lesson.writing}</p>
      ) : (
        <>
          <h1>{zhRuns(g.titleVi)}</h1>
          <p class="lead">{zhRuns(g.summaryVi)}</p>
          <DraftBadge item={g} />
          {o && (
            <p class="muted">
              {T.grammar.official}:{' '}
              <span class="zh" lang="zh-CN">
                {[o.categoryName, o.item, o.content].filter(Boolean).join(' · ')}
              </span>
            </p>
          )}
          <div class="card explanation">
            {g.explanationVi.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}
            {g.patterns && g.patterns.length > 0 && (
              <>
                <h2>{T.grammar.patterns}</h2>
                <ul class="patterns">
                  {g.patterns.map((p) => (
                    <li key={p}>{zhRuns(p)}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div class="card">
            <h2>{T.grammar.examples}</h2>
            <ul class="examples">
              {g.examples.map((s) => (
                <li key={s.zh}>
                  <div class="example-zh">
                    <Pinyin zh={s.zh} py={s.py} />
                    <SpeakButton text={s.zh} />
                  </div>
                  <div class="example-vi">{s.vi}</div>
                </li>
              ))}
            </ul>
          </div>
          {g.mistakes && g.mistakes.length > 0 && (
            <div class="card">
              <h2>{T.grammar.mistakes}</h2>
              <ul class="mistakes">
                {g.mistakes.map((m) => (
                  <li key={m.wrong}>
                    <div>
                      <span class="tag bad">{T.grammar.wrong}</span>{' '}
                      <s class="zh" lang="zh-CN">
                        {m.wrong}
                      </s>
                    </div>
                    <div>
                      <span class="tag good">{T.grammar.right}</span>{' '}
                      <span class="zh" lang="zh-CN">
                        {m.right}
                      </span>
                    </div>
                    <div class="muted">{zhRuns(m.noteVi)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
