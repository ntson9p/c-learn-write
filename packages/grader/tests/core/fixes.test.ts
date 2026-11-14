import { describe, expect, it } from 'vitest';
import { applyFixes } from '../../src/core/fixes';

describe('applyFixes', () => {
  it('replaces and inserts text', () => {
    // 二个苹果 -> 两个苹果 ; 四苹果 -> 四个苹果
    expect(applyFixes('二个苹果', [{ start: 0, end: 1, replacement: '两' }]).text).toBe('两个苹果');
    expect(applyFixes('四苹果', [{ start: 1, end: 1, replacement: '个' }]).text).toBe('四个苹果');
  });

  it('applies several fixes in position order', () => {
    const result = applyFixes('有二苹果', [
      { start: 2, end: 2, replacement: '个' },
      { start: 1, end: 2, replacement: '两' },
    ]);
    expect(result.text).toBe('有两个苹果');
    expect(result.applied).toHaveLength(2);
    expect(result.skipped).toHaveLength(0);
  });

  it('inserts before replacing at the same position', () => {
    // 四平果: missing measure word (insert 个 at 1) + homophone typo (平 -> 苹 at 1)
    const result = applyFixes('四平果', [
      { start: 1, end: 2, replacement: '苹' },
      { start: 1, end: 1, replacement: '个' },
    ]);
    expect(result.text).toBe('四个苹果');
    expect(result.skipped).toHaveLength(0);
  });

  it('skips fixes inside a broader fix', () => {
    const result = applyFixes('苹果绿', [
      { start: 0, end: 3, replacement: '绿苹果' },
      { start: 0, end: 1, replacement: '平' },
    ]);
    expect(result.text).toBe('绿苹果');
    expect(result.skipped).toEqual([{ start: 0, end: 1, replacement: '平' }]);
  });

  it('maps new positions back to the original text', () => {
    const result = applyFixes('四苹果', [{ start: 1, end: 1, replacement: '个' }]);
    // 四(0) 个(inserted at 1) 苹(1) 果(2) end(3)
    expect(result.toOriginal).toEqual([0, 1, 1, 2, 3]);
  });

  it('leaves the text unchanged without fixes', () => {
    expect(applyFixes('你好', [])).toMatchObject({ text: '你好', toOriginal: [0, 1, 2] });
  });
});
