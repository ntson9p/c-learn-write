import { useState } from 'preact/hooks';
import { useAsync } from '../components/hooks';
import type { PageProps } from '../components/lazy';
import { SpeakButton } from '../components/speak';
import { Pinyin, zhRuns } from '../components/text';
import { answerCard, SAME_SESSION_MS, sessionFor } from '../lib/cards';
import { findWord, type WordEntry } from '../lib/content';
import type { StoredCard } from '../lib/db';
import { settings } from '../lib/settings';
import { formatInterval, isNewCard, previewIntervals, RATINGS, type Rating } from '../lib/srs';
import { href } from '../router';
import { T } from '../strings';

const noOf = (wordId: string) => Number(wordId.slice(1));

function CardBack({ entry }: { entry: WordEntry }) {
  const example = entry.content?.examples[0];
  return (
    <div class="card-back">
      <p class="pinyin-big">{entry.official.pinyin}</p>
      {settings.value.showHanViet && <p class="hanviet">{entry.official.hanViet}</p>}
      <p class="meaning-big">{entry.content ? zhRuns(entry.content.meaningsVi.join('; ')) : entry.official.hanViet}</p>
      {example && (
        <div class="example">
          <div class="example-zh">
            <Pinyin zh={example.zh} py={example.py} />
            <SpeakButton text={example.zh} />
          </div>
          <div class="example-vi">{example.vi}</div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage(_props: PageProps) {
  const plan = useAsync(() => sessionFor(new Date(), settings.value.newWordsPerDay), []);
  const [queue, setQueue] = useState<StoredCard[] | null>(null);
  const [shown, setShown] = useState(false);
  const [answered, setAnswered] = useState(0);
  const current = queue?.[0];
  const entry = useAsync(async () => (current ? findWord(noOf(current.wordId)) : undefined), [current?.wordId, current?.reps]);

  if (plan.loading) return <p class="loading">{T.loading}</p>;
  const p = plan.data;

  if (!queue) {
    return (
      <section class="page review-page">
        <h1>{T.review.title}</h1>
        {!p || p.queue.length === 0 ? (
          <p class="card">{answered > 0 ? T.review.nothingDue : T.review.empty}</p>
        ) : (
          <div class="card">
            <p>{T.review.summary(p.due, p.fresh)}</p>
            <button type="button" class="button primary" onClick={() => setQueue(p.queue)}>
              {T.review.start}
            </button>
          </div>
        )}
        <p>
          <a href={href('/')}>{T.backHome}</a>
        </p>
      </section>
    );
  }

  if (!current) {
    return (
      <section class="page review-page">
        <h1>{T.review.title}</h1>
        <p class="card notice ok" role="status">
          {T.review.done(answered)}
        </p>
        <button
          type="button"
          class="button"
          onClick={() => {
            setQueue(null);
            plan.reload();
          }}
        >
          {T.review.again}
        </button>
      </section>
    );
  }

  const now = new Date();
  const intervals = previewIntervals(current, now);
  const answer = async (rating: Rating) => {
    const next = await answerCard(current, rating, new Date());
    setAnswered((n) => n + 1);
    setShown(false);
    const rest = queue.slice(1);
    // Learning steps: a card due again within the session comes back at the end.
    setQueue(next.due - Date.now() <= SAME_SESSION_MS ? [...rest, next] : rest);
  };

  return (
    <section class="page review-page">
      <p class="muted" aria-live="polite">
        {T.review.remaining(queue.length)}
      </p>
      <div class="card flashcard" data-testid="flashcard">
        {isNewCard(current) && <span class="badge ok">{T.review.newBadge}</span>}
        <div class="word-main">
          <span class="zh hanzi-big" lang="zh-CN">
            {entry.data?.official.word ?? '…'}
          </span>
          {entry.data && <SpeakButton text={entry.data.official.word} />}
        </div>
        {shown && entry.data && <CardBack entry={entry.data} />}
      </div>
      {!shown ? (
        <button type="button" class="button primary wide" onClick={() => setShown(true)}>
          {T.review.show}
        </button>
      ) : (
        <div class="rating-row" role="group">
          {RATINGS.map((r) => (
            <button key={r} type="button" class={`button rating r${r}`} onClick={() => void answer(r)}>
              <span>{T.review.ratings[r]}</span>
              <span class="hint">{formatInterval(intervals[r])}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
