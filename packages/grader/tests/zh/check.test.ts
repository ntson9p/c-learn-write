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
