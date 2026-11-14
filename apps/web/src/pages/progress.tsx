import type { PageProps } from '../components/lazy';
import { T } from '../strings';

export default function ProgressPage(_props: PageProps) {
  return (
    <section class="page">
      <h1>{T.progress.title}</h1>
    </section>
  );
}
