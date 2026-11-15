import { describe, expect, it } from 'vitest';
import { expandPattern, PatternError } from '../../src/core/patterns';

describe('expandPattern', () => {
  it('returns plain text unchanged', () => {
    expect(expandPattern('我是越南人。')).toEqual(['我是越南人。']);
  });

  it('expands optional parts, full form first', () => {
    expect(expandPattern('(我)是越南人')).toEqual(['我是越南人', '是越南人']);
  });

  it('expands alternatives', () => {
    expect(expandPattern('[这|那]是苹果')).toEqual(['这是苹果', '那是苹果']);
  });

  it('expands nested groups', () => {
    expect(expandPattern('[这(个)|那]是苹果')).toEqual(['这个是苹果', '这是苹果', '那是苹果']);
  });

  it('combines several groups', () => {
    expect(expandPattern('(现在)(是)两点(钟)')).toEqual([
      '现在是两点钟',
      '现在是两点',
      '现在两点钟',
      '现在两点',
      '是两点钟',
      '是两点',
      '两点钟',
      '两点',
    ]);
  });

  it('removes duplicates and empty results', () => {
    expect(expandPattern('[苹果|苹果](。)')).toEqual(['苹果。', '苹果']);
    expect(expandPattern('(我)')).toEqual(['我']);
  });

  it('rejects malformed patterns', () => {
    expect(() => expandPattern('[这|那是苹果')).toThrow(PatternError);
    expect(() => expandPattern('(这是苹果')).toThrow(PatternError);
    expect(() => expandPattern('这是)苹果')).toThrow(PatternError);
    expect(() => expandPattern('(这|那)是苹果')).toThrow(/Use \[a\|b\]/);
    expect(() => expandPattern('')).toThrow(PatternError);
    expect(() => expandPattern('()')).toThrow(PatternError);
  });

  it('refuses patterns that expand too much', () => {
    const pattern = '(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)';
    expect(expandPattern(pattern, 2000)).toHaveLength(1023);
    expect(() => expandPattern(pattern, 500)).toThrow(/more than 500/);
  });
});
