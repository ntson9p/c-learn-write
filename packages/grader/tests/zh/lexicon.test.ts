import { describe, expect, it } from 'vitest';
import {
  ACTION_VERBS,
  ADJECTIVES,
  COLORS,
  LOCALIZERS,
  MEASURE_WORDS,
  NON_NUMBER_PATTERNS,
  NOT_REVERSED,
  NOUNS,
  PLACES,
  ZAI_VERBS,
  matchLongest,
} from '../../src/lang/zh/lexicon';

describe('place and verb data', () => {
  it('loads places and localizers', () => {
    expect(PLACES.get('中国')).toEqual({ word: '中国', kind: 'proper' });
    expect(PLACES.get('家')).toEqual({ word: '家', kind: 'place' });
    expect(PLACES.get('桌子')).toEqual({ word: '桌子', kind: 'object', localizer: '上' });
    expect(LOCALIZERS.get('里面')).toBe('里');
    expect(LOCALIZERS.get('底下')).toBe('下');
  });

  it('only lists "not reversed" words that start with a localizer', () => {
    for (const word of NOT_REVERSED) expect(['上', '下', '里', '外', '前', '后'], word).toContain(word[0]);
  });

  it('counts verbs taking 在 after them as action verbs', () => {
    expect(ACTION_VERBS.has('吃饭')).toBe(true);
    for (const verb of ZAI_VERBS) expect(ACTION_VERBS.has(verb), verb).toBe(true);
    expect(ACTION_VERBS.has('喜欢')).toBe(false);
    expect(ACTION_VERBS.has('去')).toBe(false);
  });
});

describe('lexicon data', () => {
  it('loads the word lists', () => {
    expect(MEASURE_WORDS.get('个')).toEqual({ word: '个', kind: 'individual', erOk: false });
    expect(MEASURE_WORDS.get('月')?.kind).toBe('calendar');
    expect(MEASURE_WORDS.get('斤')?.erOk).toBe(true);
    expect(NOUNS.get('苹果')?.measures[0]).toBe('个');
    expect(NOUNS.get('书')?.measures).toEqual(['本']);
    expect(NOUNS.get('人')?.bare).toBe('formal');
    expect(COLORS).toContain('绿');
    expect(ADJECTIVES).toContain('漂亮');
  });

  it('only uses measure words that exist', () => {
    // loadNouns throws on unknown measure words; this documents the guarantee.
    for (const noun of NOUNS.values()) {
      for (const m of noun.measures) expect(MEASURE_WORDS.has(m)).toBe(true);
    }
  });

  it('compiles the non-number patterns', () => {
    expect(NON_NUMBER_PATTERNS.length).toBeGreaterThan(10);
    const blocks = (text: string) => NON_NUMBER_PATTERNS.some((re) => new RegExp(re.source, 'u').test(text));
    expect(blocks('我们一起去')).toBe(true);
    expect(blocks('看一看')).toBe(true);
    expect(blocks('十分好')).toBe(true);
    expect(blocks('十分钟')).toBe(false);
    expect(blocks('千万别忘了')).toBe(true);
    expect(blocks('一千万')).toBe(false);
    expect(blocks('两周四天')).toBe(false);
    expect(blocks('有四个苹果')).toBe(false);
  });
});

describe('matchLongest', () => {
  it('prefers the longest word', () => {
    const words = ['点钟', '点', '公斤'].sort((a, b) => b.length - a.length);
    expect(matchLongest('两点钟', 1, words)).toBe('点钟');
    expect(matchLongest('两点了', 1, words)).toBe('点');
    expect(matchLongest('两点钟', 1, words, 2)).toBe('点');
    expect(matchLongest('两个', 1, words)).toBeUndefined();
  });
});
