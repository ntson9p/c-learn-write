import { describe, expect, it } from 'vitest';
import { analyzeZh, findNumberSpans, splitClauses, type QuantityPhrase } from '../../src/lang/zh/analyze';

const summary = (p: QuantityPhrase) => ({
  value: p.number.parsed.value,
  measure: p.measure?.text,
  modifiers: p.modifiers.map((m) => m.base),
  noun: p.noun?.noun,
  match: p.noun?.match,
  trailing: p.trailing.map((m) => m.base),
  negated: p.negated,
  approximate: p.number.approximate,
});

const phrases = (text: string, expectedNouns?: string[]) =>
  analyzeZh(text, expectedNouns ? { expectedNouns } : {}).phrases.map(summary);

describe('splitClauses', () => {
  it('splits on Chinese and ASCII punctuation', () => {
    expect(splitClauses('有四个，两个红的。').map((c) => c.text)).toEqual(['有四个', '两个红的']);
    expect(splitClauses('a,b;c').map((c) => c.text)).toEqual(['a', 'b', 'c']);
    expect(splitClauses('')).toEqual([]);
  });
});

describe('findNumberSpans', () => {
  const texts = (text: string) => findNumberSpans(text).map((s) => s.text);

  it('finds numbers', () => {
    expect(texts('我们一起吃了十四个苹果')).toEqual(['十四']);
    expect(texts('有4个，还有两个')).toEqual(['4', '两']);
    expect(texts('二〇二六年')).toEqual(['二〇二六']);
  });

  it('ignores words that only contain numeral characters', () => {
    expect(texts('一共四个')).toEqual(['四']);
    expect(findNumberSpans('星期四有四个')).toEqual([{ start: 4, end: 5, text: '四' }]);
    expect(texts('十分好')).toEqual([]);
    expect(texts('十分钟')).toEqual(['十']);
    expect(texts('看一看')).toEqual([]);
    expect(texts('一样')).toEqual([]);
  });

  it('ignores ordinals', () => {
    expect(texts('第四个')).toEqual([]);
  });
});

describe('analyzeZh', () => {
  it('reads a full quantity phrase', () => {
    expect(phrases('图片里有四个绿苹果。', ['苹果'])).toEqual([
      { value: 4, measure: '个', modifiers: ['绿'], noun: '苹果', match: 'exact', trailing: [], negated: false, approximate: false },
    ]);
  });

  it('separates phrases joined by 和', () => {
    expect(phrases('有四个红苹果和两个绿苹果').map((p) => [p.value, p.modifiers, p.noun])).toEqual([
      [4, ['红'], '苹果'],
      [2, ['绿'], '苹果'],
    ]);
  });

  it('handles phrases without measure word or noun', () => {
    expect(phrases('有四')[0]).toMatchObject({ value: 4, measure: undefined, noun: undefined });
    expect(phrases('有四苹果')[0]).toMatchObject({ value: 4, measure: undefined, noun: '苹果' });
    expect(phrases('有两个红的')[0]).toMatchObject({ value: 2, measure: '个', modifiers: ['红'], noun: undefined });
  });

  it('detects modifiers placed after the noun', () => {
    expect(phrases('有四个苹果绿')[0]?.trailing).toEqual(['绿']);
    expect(phrases('一件衣服新')[0]?.trailing).toEqual(['新']);
    expect(phrases('有四个芒果绿')[0]).toMatchObject({ noun: '芒果', match: 'unknown', trailing: ['绿'] });
  });

  it('does not treat predicates as misplaced modifiers', () => {
    expect(phrases('有四个苹果是绿的')[0]?.trailing).toEqual([]);
    expect(phrases('四个苹果绿了')[0]?.trailing).toEqual([]);
    expect(phrases('四个苹果很大')[0]?.trailing).toEqual([]);
    expect(phrases('四个苹果好吃')[0]?.trailing).toEqual([]);
  });

  it('reads colour words with shade, 色 and 的', () => {
    const doc = analyzeZh('有四个浅绿色的苹果');
    expect(doc.phrases[0]?.modifiers).toMatchObject([{ base: '绿', text: '浅绿色的', kind: 'color' }]);
    expect(doc.phrases[0]?.noun?.noun).toBe('苹果');
  });

  it('recognises homophone typos of the expected noun', () => {
    const doc = analyzeZh('有四个绿平果', { expectedNouns: ['苹果'] });
    expect(doc.phrases[0]?.noun).toMatchObject({
      noun: '苹果',
      match: 'homophone',
      text: '平果',
      typos: [{ index: 4, written: '平', expected: '苹' }],
    });
    // Without the expected noun the word stays unknown.
    expect(phrases('有四个绿平果')[0]).toMatchObject({ noun: '平果', match: 'unknown' });
  });

  it('recognises homophone typos of an expected colour', () => {
    const doc = analyzeZh('有四个率苹果', { expectedNouns: ['苹果'], expectedColors: ['绿'] });
    expect(doc.phrases[0]?.modifiers).toMatchObject([{ base: '绿', text: '率', typos: [{ written: '率', expected: '绿' }] }]);
    expect(doc.phrases[0]?.noun?.noun).toBe('苹果');
    // Without expected colours, 率 is not a modifier.
    expect(analyzeZh('有四个率苹果', { expectedNouns: ['苹果'] }).phrases[0]?.modifiers).toEqual([]);
  });

  it('marks unknown words close to the expected noun', () => {
    const doc = analyzeZh('有四个苹里', { expectedNouns: ['苹果'] });
    expect(doc.phrases[0]?.noun).toMatchObject({ noun: '苹里', match: 'unknown', near: '苹果' });
  });

  it('prefers longer lexicon words', () => {
    expect(phrases('四棵苹果树', ['苹果'])[0]?.noun).toBe('苹果树');
    expect(phrases('有四个三明治')[0]?.noun).toBe('三明治');
    expect(phrases('四个小时')[0]?.noun).toBe('小时');
  });

  it('detects negation and approximate numbers', () => {
    expect(phrases('没有四个')[0]?.negated).toBe(true);
    expect(phrases('不是四个')[0]?.negated).toBe(true);
    expect(phrases('有四个')[0]?.negated).toBe(false);
    expect(phrases('有四五个')[0]).toMatchObject({ value: 4, approximate: true });
    expect(phrases('有十几个')[0]).toMatchObject({ value: 10, approximate: true, measure: '个' });
    expect(phrases('有二十多个')[0]).toMatchObject({ value: 20, approximate: true, measure: '个' });
    expect(phrases('有几十个')[0]).toMatchObject({ value: 10, approximate: true });
  });

  it('classifies measure words', () => {
    const doc = analyzeZh('我四岁，四月来的');
    expect(doc.phrases.map((p) => p.measure?.info.kind)).toEqual(['time', 'calendar']);
  });
});
