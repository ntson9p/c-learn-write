import { loadCharacters } from '@c-learn-write/course';
import { useAsync } from '../components/hooks';
import type { PageProps } from '../components/lazy';
import { CharacterWriter } from '../components/writer';
import { recordWriting, writingRecords } from '../lib/writing';
import { href } from '../router';
import { T } from '../strings';

/** Handwriting characters in syllabus order: HSK2 (100) then HSK3 (150). */
async function handwriting(): Promise<{ level: number; chars: string[] }[]> {
  const c = await loadCharacters();
  return Object.entries(c.handwriting)
    .map(([level, chars]) => ({ level: Number(level), chars }))
    .sort((a, b) => a.level - b.level);
}

export default function WritePage({ params }: PageProps) {
  const lists = useAsync(handwriting, []);
  const records = useAsync(writingRecords, [params.char]);
  if (lists.loading || !lists.data) return <p class="loading">{T.loading}</p>;
  const all = lists.data.flatMap((l) => l.chars);
  const char = params.char;

  if (char) {
    const i = all.indexOf(char);
    const next = all[i + 1];
    return (
      <section class="page write-page">
        <p class="muted">
          <a href={href('/write')}>{T.writing.title}</a>
        </p>
        <h1 class="zh" lang="zh-CN">
          {char}
        </h1>
        {i < 0 ? (
          <p class="card">{T.notFound}</p>
        ) : (
          <div class="card">
            <CharacterWriter key={char} char={char} onQuizDone={(m) => void recordWriting(char, m, new Date()).then(records.reload)} />
            {next && (
              <a class="button" href={href(`/write/${encodeURIComponent(next)}`)}>
                {T.writing.next}
              </a>
            )}
          </div>
        )}
        <p class="muted small">{T.writing.license}</p>
      </section>
    );
  }

  const done = records.data ?? {};
  return (
    <section class="page write-page">
      <h1>{T.writing.title}</h1>
      <p class="lead">{T.writing.intro}</p>
      <p class="muted">{T.writing.practiced(Object.keys(done).length)}</p>
      {lists.data.map((l) => (
        <div class="card" key={l.level}>
          <h2>{T.writing.level(l.level, l.chars.length)}</h2>
          <ul class="char-grid">
            {l.chars.map((ch) => (
              <li key={ch}>
                <a class={`char-cell zh${done[ch] ? ' done' : ''}`} lang="zh-CN" href={href(`/write/${encodeURIComponent(ch)}`)}>
                  {ch}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p class="muted small">{T.writing.license}</p>
    </section>
  );
}
