import type { PageProps } from '../components/lazy';
import { T } from '../strings';

const LEVELS = [
  { level: 1, words: 300, grammar: 70 },
  { level: 2, words: 200, grammar: 78 },
  { level: 3, words: 500, grammar: 96 },
];

export default function HomePage(_props: PageProps) {
  return (
    <section class="page home-page">
      <h1>{T.home.title}</h1>
      <p class="lead">{T.home.intro}</p>
      {LEVELS.map((l) => (
        <div class="card level" key={l.level}>
          <h2>HSK{l.level}</h2>
          <p class="muted">
            {T.home.levelWords(l.words)} · {T.home.levelGrammar(l.grammar)}
          </p>
          <p>{T.home.comingSoon}</p>
        </div>
      ))}
    </section>
  );
}
