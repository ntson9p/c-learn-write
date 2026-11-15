import { LEVELS, type Level, type WordContent } from '@c-learn-write/course';
import { useMemo, useState } from 'preact/hooks';
import { useAsync } from '../components/hooks';
import type { PageProps } from '../components/lazy';
import { lessonsOf, officialWords } from '../lib/content';
import { searchWords, type DictEntry } from '../lib/search';
import { href } from '../router';
import { T } from '../strings';

const MAX_SHOWN = 100;

async function loadEntries(): Promise<DictEntry[]> {
  const words = await officialWords();
  const contents = new Map<number, WordContent>();
  for (const level of LEVELS) for (const l of await lessonsOf(level)) for (const w of l.content?.words ?? []) contents.set(w.no, w);
  return [...words.values()].filter((w) => w.level <= 3).map((official) => ({ official, content: contents.get(official.no) ?? null }));
}

export default function DictionaryPage(_props: PageProps) {
  const entries = useAsync(loadEntries, []);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<Level | 0>(0);
  const results = useMemo(
    () => searchWords((entries.data ?? []).filter((e) => level === 0 || e.official.level === level), query),
    [entries.data, query, level],
  );

  return (
    <section class="page dict-page">
      <h1>{T.dict.title}</h1>
      <label class="visually-hidden" for="dict-search">
        {T.dict.search}
      </label>
      <input
        id="dict-search"
        class="search"
        type="search"
        placeholder={T.dict.search}
        value={query}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
      />
      <div class="chips" role="group">
        {([0, ...LEVELS] as const).map((l) => (
          <button key={l} type="button" class={l === level ? 'chip active' : 'chip'} aria-pressed={l === level} onClick={() => setLevel(l)}>
            {l === 0 ? T.dict.all : `HSK${l}`}
          </button>
        ))}
      </div>
      {entries.loading ? (
        <p class="loading">{T.loading}</p>
      ) : (
        <>
          <p class="muted">{T.dict.count(Math.min(results.length, MAX_SHOWN), results.length)}</p>
          {results.length === 0 && <p>{T.dict.noResult}</p>}
          <ul class="dict-list">
            {results.slice(0, MAX_SHOWN).map(({ official, content }) => (
              <li key={official.no}>
                <a href={href(`/word/${official.no}`)}>
                  <span class="zh hanzi" lang="zh-CN">
                    {official.word}
                  </span>
                  <span class="pinyin">{official.pinyin}</span>
                  <span class="meaning">{content?.meaningsVi.join('; ') ?? official.hanViet}</span>
                  <span class="badge">HSK{official.level}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
