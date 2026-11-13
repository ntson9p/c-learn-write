import { describe, expect, it } from 'vitest';
import { normalizeZh } from '../../src/lang/zh/normalize';

describe('normalizeZh', () => {
  it('keeps simplified Chinese and its punctuation', () => {
    expect(normalizeZh('图片里有四个绿苹果。')).toEqual({ text: '图片里有四个绿苹果。', convertedTraditional: false });
  });

  it('removes spaces, including the ideographic space', () => {
    expect(normalizeZh(' 有 四个　苹果 ').text).toBe('有四个苹果');
  });

  it('turns full-width digits and letters into ASCII', () => {
    expect(normalizeZh('有４个').text).toBe('有4个');
    expect(normalizeZh('ＡＢｃ').text).toBe('ABc');
  });

  it('removes zero-width characters', () => {
    expect(normalizeZh('有​四个').text).toBe('有四个');
  });

  it('converts traditional characters to simplified ones', () => {
    expect(normalizeZh('圖片裡有四個綠蘋果')).toEqual({ text: '图片里有四个绿苹果', convertedTraditional: true });
    expect(normalizeZh('我沒有書').text).toBe('我没有书');
  });
});
