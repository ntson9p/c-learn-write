import type { PageProps } from '../components/lazy';
import { T } from '../strings';

export default function ReviewPage(_props: PageProps) {
  return (
    <section class="page">
      <h1>{T.review.title}</h1>
    </section>
  );
}
