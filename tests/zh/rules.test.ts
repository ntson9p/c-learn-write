import { describe, expect, it } from 'vitest';
import { applyFixes } from '../../src/core/fixes';
import { analyzeZh } from '../../src/lang/zh/analyze';
import { ZH_DEFAULT_PENALTIES } from '../../src/lang/zh/issues';
import { runZhRules, type ZhRuleContext } from '../../src/lang/zh/rules';

const free: ZhRuleContext = { penalties: ZH_DEFAULT_PENALTIES, countQuestion: false, allowArabicDigits: true };
const count = (noun: string): ZhRuleContext => ({ ...free, countQuestion: true, targetNoun: noun });

const run = (text: string, ctx: ZhRuleContext = free) =>
  runZhRules(analyzeZh(text, ctx.targetNoun ? { expectedNouns: [ctx.targetNoun] } : {}), ctx);
const codes = (text: string, ctx?: ZhRuleContext) => run(text, ctx).map((i) => i.code);
const fixed = (text: string, ctx?: ZhRuleContext) =>
  applyFixes(text, run(text, ctx).flatMap((i) => (i.fix ? [i.fix] : []))).text;

describe('missing_measure_word', () => {
  it('flags a number directly followed by a noun', () => {
    expect(codes('有四苹果')).toEqual(['missing_measure_word']);
    expect(fixed('有四苹果')).toBe('有四个苹果');
    expect(fixed('四绿苹果')).toBe('四个绿苹果');
    expect(fixed('有三书')).toBe('有三本书');
    expect(fixed('十几苹果')).toBe('十几个苹果');
  });

  it('flags a bare number in count questions only', () => {
    expect(fixed('有四', count('苹果'))).toBe('有四个');
    expect(fixed('有两', count('猫'))).toBe('有两只');
    expect(codes('我有四')).toEqual([]);
  });

  it('explains the formal bare form', () => {
    const [issue] = run('有四人');
    expect(issue?.code).toBe('missing_measure_word');
    expect(issue?.message).toContain('trang trọng');
  });

  it('stays silent when no measure word is needed', () => {
    for (const text of ['四个苹果', '我四岁', '四月', '第四', '二〇二六年', '四小时', '两星期', '有四个梨']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('wrong_measure_word', () => {
  it('flags a measure word that does not fit the noun', () => {
    expect(codes('有四本苹果')).toEqual(['wrong_measure_word']);
    expect(fixed('有四本苹果')).toBe('有四个苹果');
    expect(fixed('三个书')).toBe('三本书');
    expect(fixed('两个猫')).toBe('两只猫');
  });

  it('checks answers that leave the noun out', () => {
    expect(fixed('有两个', count('猫'))).toBe('有两只');
    expect(codes('有两只', count('猫'))).toEqual([]);
  });

  it('accepts every listed measure word and general/container ones', () => {
    for (const text of ['四颗苹果', '四种苹果', '四杯咖啡', '两只狗', '两条狗', '三张桌子', '一把椅子', '四个芒果']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('er_liang', () => {
  it('requires 两 before measure words', () => {
    expect(codes('二个苹果')).toEqual(['er_liang']);
    expect(fixed('二个苹果')).toBe('两个苹果');
    expect(fixed('现在二点')).toBe('现在两点');
    expect(fixed('我等了二天')).toBe('我等了两天');
  });

  it('combines with a missing measure word', () => {
    expect(codes('有二', count('苹果'))).toEqual(['er_liang', 'missing_measure_word']);
    expect(fixed('有二', count('苹果'))).toBe('有两个');
  });

  it('keeps 二 where it is correct', () => {
    for (const text of ['两个苹果', '十二个', '二十个', '二月', '二号', '第二个', '二楼', '二年级', '二斤', '星期二']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('liang_misuse', () => {
  it('flags 两 inside compound numbers and ordinals', () => {
    expect(fixed('十两个')).toBe('十二个');
    expect(fixed('两十个')).toBe('二十个');
    expect(fixed('第两个')).toBe('第二个');
  });

  it('accepts 两 where it is correct', () => {
    for (const text of ['两个', '两百个', '两千块', '两三个', '一两个']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('modifier_order', () => {
  it('moves a modifier placed after the noun', () => {
    expect(codes('四个苹果绿')).toEqual(['modifier_order']);
    expect(fixed('四个苹果绿')).toBe('四个绿苹果');
    expect(fixed('四个苹果绿色的')).toBe('四个绿色的苹果');
    expect(fixed('一件衣服新')).toBe('一件新衣服');
  });

  it('writes the intended noun when it also has a homophone typo', () => {
    expect(codes('有四个平果绿', count('苹果'))).toEqual(['homophone_char', 'modifier_order']);
    expect(fixed('有四个平果绿', count('苹果'))).toBe('有四个绿苹果');
  });

  it('accepts predicates after the noun', () => {
    for (const text of ['四个苹果是绿的', '四个苹果很大', '四个苹果绿了', '四个绿苹果']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('bu_you', () => {
  it('replaces 不有 with 没有', () => {
    expect(codes('我不有书')).toEqual(['bu_you']);
    expect(fixed('我不有书')).toBe('我没有书');
  });

  it('keeps fixed expressions', () => {
    for (const text of ['无所不有', '一点也不有趣', '他不有名']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('homophone_char', () => {
  it('names both readings', () => {
    const [issue] = run('有四个绿平果', count('苹果'));
    expect(issue).toMatchObject({ code: 'homophone_char', start: 4, end: 5, penalty: 5 });
    expect(issue?.message).toContain('píng');
  });
});

describe('arabic_digits', () => {
  const strict: ZhRuleContext = { ...free, allowArabicDigits: false };

  it('asks for characters when the question requires them', () => {
    expect(fixed('有4个苹果', strict)).toBe('有四个苹果');
    expect(fixed('有2只猫', strict)).toBe('有两只猫');
    expect(fixed('2月', strict)).toBe('二月');
    expect(codes('有4个苹果')).toEqual([]);
  });
});
