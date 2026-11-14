import { useEffect, useState } from 'preact/hooks';
import type { PageProps } from '../components/lazy';
import { T } from '../strings';

export const REPO_URL = 'https://github.com/ntson9p/c-learn-write';

export interface DataSource {
  name: string;
  use: string;
  license: string;
  url: string;
}

/** Data the app is built from (also listed in THIRD_PARTY_NOTICES.md). */
export const DATA_SOURCES: DataSource[] = [
  {
    name: '《中文水平考试 HSK 考试大纲》 (2025), 中外语言交流合作中心',
    use: 'Danh sách từ, chữ và điểm ngữ pháp HSK1–3',
    license: 'Danh sách được dùng như dữ kiện; bản chép máy đọc được ofou/hsk theo giấy phép MIT',
    url: 'https://www.chinesetest.cn/HSK',
  },
];

export default function AboutPage(_props: PageProps) {
  const [licenses, setLicenses] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('./licenses.txt')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => alive && setLicenses(text.startsWith('c-learn-write') ? text : ''))
      .catch(() => alive && setLicenses(''));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section class="page about-page">
      <h1>{T.about.title}</h1>
      <p class="lead">{T.about.intro}</p>

      <div class="card">
        <h2>{T.about.principlesTitle}</h2>
        <ul>
          {T.about.principles.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div class="card">
        <h2>{T.about.sourcesTitle}</h2>
        <ul class="sources">
          {DATA_SOURCES.map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.name}
              </a>
              <span class="muted"> · {s.use} · {s.license}</span>
            </li>
          ))}
        </ul>
      </div>

      <div class="card">
        <h2>{T.about.licensesTitle}</h2>
        <p>{T.about.codeLicense}</p>
        <p>{T.about.contentLicense}</p>
        <p>
          {T.about.sourceCode}:{' '}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            {REPO_URL}
          </a>
        </p>
        <details>
          <summary>{T.about.thirdParty}</summary>
          {licenses === null ? <p>{T.loading}</p> : licenses ? <pre class="licenses">{licenses}</pre> : <p>{T.about.thirdPartyMissing}</p>}
        </details>
      </div>
    </section>
  );
}
