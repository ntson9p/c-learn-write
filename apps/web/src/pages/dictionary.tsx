import type { PageProps } from '../components/lazy';
import { T } from '../strings';

export default function DictionaryPage(_props: PageProps) {
  return (
    <section class="page">
      <h1>{T.dict.title}</h1>
    </section>
  );
}
