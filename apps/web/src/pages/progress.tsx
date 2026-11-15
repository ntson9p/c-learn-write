import { CURRICULUM, LEVELS } from '@c-learn-write/course';
import { useAsync } from '../components/hooks';
import type { PageProps } from '../components/lazy';
import { zhRuns } from '../components/text';
import { findGrammar } from '../lib/content';
import { loadStats } from '../lib/stats';
import { href } from '../router';
import { T } from '../strings';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div class="stat">
      <span class="stat-value">{value}</span>
      <span class="stat-label">{label}</span>
    </div>
  );
}

export default function ProgressPage(_props: PageProps) {
  const stats = useAsync(() => loadStats(new Date()), []);
  const weak = useAsync(async () => {
    const list = stats.data?.weak.slice(0, 8) ?? [];
    return Promise.all(list.map(async (no) => ({ no, title: (await findGrammar(no))?.content?.titleVi ?? `#${no}` })));
  }, [stats.data]);
  if (stats.loading || !stats.data) return <p class="loading">{T.loading}</p>;
  const s = stats.data;
  const titleOf = (lessonId?: string) => CURRICULUM.find((l) => l.id === lessonId)?.titleVi ?? '';

  return (
    <section class="page progress-page">
      <h1>{T.progress.title}</h1>
      <p class="lead streak">{T.progress.streak(s.streak)}</p>

      <div class="card">
        <h2>{T.progress.words}</h2>
        <div class="stat-grid">
          <Stat label={T.progress.inReview} value={s.cards.total} />
          <Stat label={T.progress.mature} value={s.cards.mature} />
          <Stat label={T.progress.learning} value={s.cards.learning} />
          <Stat label={T.progress.fresh} value={s.cards.fresh} />
          <Stat label={T.progress.due} value={s.cards.dueNow} />
          <Stat label={T.progress.reviewsToday} value={s.reviewsToday} />
        </div>
        {s.cards.dueNow > 0 && (
          <a class="button primary" href={href('/review')}>
            {T.home.goReview}
          </a>
        )}
      </div>

      <div class="card">
        <h2>{T.progress.lessons}</h2>
        {LEVELS.map((level) => {
          const total = CURRICULUM.filter((l) => l.level === level).length;
          const done = s.completed.filter((id) => id.startsWith(`hsk${level}-`)).length;
          return (
            <div key={level} class="level-row">
              <span>{T.progress.levelLessons(level, done, total)}</span>
              <meter min={0} max={Math.max(total, 1)} value={done} aria-label={T.progress.levelLessons(level, done, total)} />
              <a href={href(`/test/${level}`)}>{T.progress.levelTest(level)}</a>
            </div>
          );
        })}
      </div>

      {weak.data && weak.data.length > 0 && (
        <div class="card">
          <h2>{T.progress.weak}</h2>
          <ul class="link-list">
            {weak.data.map((g) => (
              <li key={g.no}>
                <a href={href(`/grammar/${g.no}`)}>{zhRuns(g.title)}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div class="card">
        <h2>{T.progress.results}</h2>
        {s.results.length === 0 ? (
          <p class="muted">{T.progress.noResults}</p>
        ) : (
          <ul class="results">
            {s.results.slice(0, 10).map((r) => (
              <li key={r.id}>
                {T.progress.resultLine(r.kind, r.kind === 'level' ? `HSK${r.level}` : `${r.lessonId} ${titleOf(r.lessonId)}`, r.score)}
                <span class="muted"> · {new Date(r.at).toLocaleDateString('vi-VN')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
