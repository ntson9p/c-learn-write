import { describe, expect, it } from 'vitest';
import { Segmenter } from '../src/segment';

describe('Segmenter', () => {
  const seg = new Segmenter(['我', '有', '时间', '有时', '时', '学生', '学', '生', '中国', '人', '中国人']);
  const words = (s: string) => seg.segment(s).map((t) => (t.known ? t.text : `?${t.text}`));

  it('prefers cuts without unknown characters, then fewer words', () => {
    expect(words('我有时间。')).toEqual(['我', '有', '时间']);
    expect(words('我是中国人')).toEqual(['我', '?是', '中国人']);
    expect(words('学生')).toEqual(['学生']);
  });

  it('skips punctuation, digits and Latin letters, and reports offsets', () => {
    const t = seg.segment('A4，我有');
    expect(t.map((x) => [x.text, x.start])).toEqual([
      ['我', 3],
      ['有', 4],
    ]);
  });
});
