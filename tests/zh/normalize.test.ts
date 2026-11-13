import { describe, expect, it } from 'vitest';
import { normalizeZh } from '../../src/lang/zh/normalize';

// Invisible characters are built from their code points so the test source
// stays readable.
const IDEOGRAPHIC_SPACE = String.fromCharCode(0x3000);
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
const BOM = String.fromCharCode(0xfeff);
const LINE_SEPARATOR = String.fromCharCode(0x2028);

describe('normalizeZh', () => {
  it('keeps simplified Chinese and its punctuation', () => {
    expect(normalizeZh('图片里有四个绿苹果。')).toEqual({ text: '图片里有四个绿苹果。', convertedTraditional: false });
  });

  it('removes spaces, including the ideographic space', () => {
    expect(normalizeZh(` 有 四个${IDEOGRAPHIC_SPACE}苹果 `).text).toBe('有四个苹果');
  });

  it('keeps lines apart as clauses', () => {
    expect(normalizeZh('有四个\n两个红的').text).toBe('有四个，两个红的');
    expect(normalizeZh('有四个 \r\n\r\n 两个红的\n').text).toBe('有四个，两个红的');
    expect(normalizeZh(`有四个${LINE_SEPARATOR}两个红的`).text).toBe('有四个，两个红的');
  });

  it('turns full-width digits and letters into ASCII', () => {
    expect(normalizeZh('有４个').text).toBe('有4个');
    expect(normalizeZh('ＡＢｃ').text).toBe('ABc');
  });

  it('removes invisible format characters', () => {
    expect(normalizeZh(`${BOM}有${ZERO_WIDTH_SPACE}四个`).text).toBe('有四个');
  });

  it('converts traditional characters to simplified ones', () => {
    expect(normalizeZh('圖片裡有四個綠蘋果')).toEqual({ text: '图片里有四个绿苹果', convertedTraditional: true });
    expect(normalizeZh('我沒有書').text).toBe('我没有书');
  });
});
