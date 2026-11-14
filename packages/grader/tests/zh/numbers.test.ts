import { describe, expect, it } from 'vitest';
import { parseZhNumber, toZhNumeral } from '../../src/lang/zh/numbers';

const value = (text: string) => parseZhNumber(text)?.value;

describe('parseZhNumber', () => {
  it('reads single digits, 两 and Arabic digits', () => {
    expect(value('四')).toBe(4);
    expect(value('两')).toBe(2);
    expect(value('二')).toBe(2);
    expect(value('零')).toBe(0);
    expect(value('4')).toBe(4);
    expect(value('14')).toBe(14);
    expect(value('肆')).toBe(4);
  });

  it('reads numbers with units', () => {
    expect(value('十')).toBe(10);
    expect(value('十四')).toBe(14);
    expect(value('二十')).toBe(20);
    expect(value('二十四')).toBe(24);
    expect(value('一百')).toBe(100);
    expect(value('一百零五')).toBe(105);
    expect(value('一百五十')).toBe(150);
    expect(value('一千零五十')).toBe(1050);
    expect(value('两百')).toBe(200);
    expect(value('一万')).toBe(10000);
    expect(value('十万')).toBe(100000);
    expect(value('三万五千')).toBe(35000);
    expect(value('一亿两千万')).toBe(120000000);
  });

  it('reads colloquial shortened forms', () => {
    expect(value('一百五')).toBe(150);
    expect(value('两千三')).toBe(2300);
    expect(value('三万五')).toBe(35000);
  });

  it('reads "A or B" pairs as ranges', () => {
    expect(parseZhNumber('四五')).toMatchObject({ value: 4, range: [4, 5] });
    expect(parseZhNumber('两三')).toMatchObject({ value: 2, range: [2, 3], liangMisuse: [] });
    expect(parseZhNumber('一两')).toMatchObject({ value: 1, range: [1, 2] });
  });

  it('reads digit strings such as years', () => {
    expect(parseZhNumber('二〇二六')).toMatchObject({ value: 2026, digitString: true });
    expect(parseZhNumber('二零二六')).toMatchObject({ value: 2026, digitString: true });
  });

  it('flags 两 in the wrong place', () => {
    expect(parseZhNumber('十两')).toMatchObject({ value: 12, liangMisuse: [1] });
    expect(parseZhNumber('二十两')).toMatchObject({ value: 22, liangMisuse: [2] });
    expect(parseZhNumber('两十')).toMatchObject({ value: 20, liangMisuse: [0] });
    expect(parseZhNumber('一百零两')).toMatchObject({ value: 102, liangMisuse: [3] });
    expect(parseZhNumber('两百')?.liangMisuse).toEqual([]);
    expect(parseZhNumber('两千三')?.liangMisuse).toEqual([]);
  });

  it('rejects malformed numerals', () => {
    expect(parseZhNumber('')).toBeNull();
    expect(parseZhNumber('十十')).toBeNull();
    expect(parseZhNumber('十百')).toBeNull();
    expect(parseZhNumber('百十')).toBeNull();
    expect(parseZhNumber('四四十')).toBeNull();
    expect(parseZhNumber('四a')).toBeNull();
  });
});

describe('toZhNumeral', () => {
  it('writes numbers in characters', () => {
    expect(toZhNumeral(0)).toBe('零');
    expect(toZhNumeral(4)).toBe('四');
    expect(toZhNumeral(10)).toBe('十');
    expect(toZhNumeral(14)).toBe('十四');
    expect(toZhNumeral(20)).toBe('二十');
    expect(toZhNumeral(105)).toBe('一百零五');
    expect(toZhNumeral(110)).toBe('一百一十');
    expect(toZhNumeral(1050)).toBe('一千零五十');
    expect(toZhNumeral(10005)).toBe('一万零五');
    expect(toZhNumeral(35000)).toBe('三万五千');
  });

  it('writes 两 for 2 before a measure word', () => {
    expect(toZhNumeral(2)).toBe('二');
    expect(toZhNumeral(2, { beforeMeasure: true })).toBe('两');
    expect(toZhNumeral(12, { beforeMeasure: true })).toBe('十二');
  });

  it('round-trips through the parser', () => {
    for (let n = 0; n <= 2500; n++) {
      expect(parseZhNumber(toZhNumeral(n))?.value).toBe(n);
    }
  });
});
