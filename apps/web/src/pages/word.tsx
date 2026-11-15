import type { PageProps } from '../components/lazy';
import { useAsync } from '../components/hooks';
import { SpeakButton } from '../components/speak';
import { DraftBadge, Pinyin, zhRuns } from '../components/text';
import { findWord } from '../lib/content';
import { settings } from '../lib/settings';
import { href } from '../router';
import { T } from '../strings';

export default function WordPage({ params }: PageProps) {
  const no = Number(params.no);
  const entry = useAsync(() => findWord(no), [no]);
  if (entry.loading) return <p class="loading">{T.loading}</p>;
  const e = entry.data;
  if (!e) return <p class="card">{T.word.notFound}</p>;
  const { official, content, lesson } = e;
  const pos = [...official.pos.map((p) => T.pos[p] ?? p)].join(', ');

  return (
    <section class="page word-page">
      <div class="card word-head">
        <div class="word-main">
          <h1 class="zh hanzi-big" lang="zh-CN">
            {official.word}
          </h1>
          <SpeakButton text={official.word} />
        </div>
        <p class="pinyin-big">{official.pinyin}</p>
        {settings.value.showHanViet && (
          <p class="hanviet" title={official.hanVietAmbiguous ? T.word.hanVietAmbiguous : undefined}>
            {T.word.hanViet}: <strong>{official.hanViet}</strong>
            {official.hanVietAmbiguous ? ' *' : ''}
          </p>
        )}
        <p class="muted">
          {T.word.level(official.level)} · {pos}
        </p>
        {content && <DraftBadge item={content} />}
      </div>

      {!content ? (
        <p class="card">{T.word.noContent}</p>
      ) : (
        <>
          <div class="card">
            <h2>{T.word.meanings}</h2>
            <ol class="meanings">
              {content.meaningsVi.map((m) => (
                <li key={m}>{zhRuns(m)}</li>
              ))}
            </ol>
            {content.noteVi && (
              <p class="note">
                <strong>{T.word.note}:</strong> {zhRuns(content.noteVi)}
              </p>
            )}
          </div>
          <div class="card">
            <h2>{T.word.examples}</h2>
            <ul class="examples">
              {content.examples.map((s) => (
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
        </>
      )}
      {lesson && (
        <p>
          {T.word.lesson}:{' '}
          <a href={href(`/lesson/${lesson.meta.id}`)}>
            {T.lessonLabel(lesson.meta.level, lesson.meta.order)} — {lesson.meta.titleVi}
          </a>
        </p>
      )}
    </section>
  );
}
