import { describe, expect, it } from 'vitest';
import { checkZhSentence } from '../../src';

describe('checkZhSentence', () => {
  it('finds the usual mistakes in a lone sentence', () => {
    expect(checkZhSentence('我吃饭在家。').issues.map((i) => i.code)).toEqual(['place_order']);
    expect(checkZhSentence('我有四本苹果。').issues.map((i) => i.code)).toEqual(['wrong_measure_word']);
    expect(checkZhSentence('我不有书。').issues.map((i) => i.code)).toEqual(['bu_you']);
  });
  it('raises nothing on correct sentences', () => {
    for (const s of ['我在家吃饭。', '我有四个苹果。', '我没有书。', '他住在河内。', '桌子上有两本书。']) {
      expect(checkZhSentence(s).issues, s).toEqual([]);
    }
  });
  it('reports spans on the normalized text', () => {
    const r = checkZhSentence('我 吃饭 在家。');
    expect(r.normalized).toBe('我吃饭在家。');
    expect(r.issues[0]?.fix).toBeDefined();
  });
});

describe('compound words of the syllabus', () => {
  it('does not read 书店 as 书 + 店 (no measure-word complaint)', () => {
    for (const s of ['学校外边有一个书店。', '学校外边有一家书店。', '这儿有一个书店。', '我们去了两个饭店。']) {
      expect(checkZhSentence(s).issues, s).toEqual([]);
    }
    // The lone noun is still checked.
    expect(checkZhSentence('我有一个书。').issues.map((i) => i.code)).toEqual(['wrong_measure_word']);
  });
});

describe('places after motion verbs', () => {
  it('does not ask for a localizer when an object follows 去/回 as a modifier or object', () => {
    for (const s of ['去上海的飞机几点飞？', '这是去上海的飞机吗？', '我要坐去上海的飞机。', '你拿回你的手机吧。']) {
      expect(checkZhSentence(s).issues, s).toEqual([]);
    }
    expect(checkZhSentence('书在桌子。').issues.map((i) => i.code)).toEqual(['missing_localizer']);
  });
});
