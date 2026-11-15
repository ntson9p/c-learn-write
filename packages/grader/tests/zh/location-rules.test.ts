import { describe, expect, it } from 'vitest';
import { applyFixes } from '../../src/core/fixes';
import { analyzeZh } from '../../src/lang/zh/analyze';
import { ZH_DEFAULT_PENALTIES } from '../../src/lang/zh/issues';
import { runZhRules, type ZhRuleContext } from '../../src/lang/zh/rules';

const free: ZhRuleContext = { penalties: ZH_DEFAULT_PENALTIES, countQuestion: false, allowArabicDigits: true };

const run = (text: string, ctx: ZhRuleContext = free) =>
  runZhRules(analyzeZh(text, ctx.expectedPlaces ? { expectedPlaces: ctx.expectedPlaces } : {}), ctx);
const codes = (text: string, ctx?: ZhRuleContext) => run(text, ctx).map((i) => i.code);
const fixed = (text: string, ctx?: ZhRuleContext) =>
  applyFixes(text, run(text, ctx).flatMap((i) => (i.fix ? [i.fix] : []))).text;

describe('place_order', () => {
  it('moves 在 + place before the verb', () => {
    const cases: [string, string][] = [
      ['我吃饭在家', '我在家吃饭'],
      ['我工作在医院', '我在医院工作'],
      ['学生吃饭在食堂', '学生在食堂吃饭'],
      ['我每天都学习在图书馆', '我每天都在图书馆学习'],
      ['我喜欢吃饭在家', '我喜欢在家吃饭'],
      ['我学习汉语在河内大学', '我在河内大学学习汉语'],
      ['我吃饭在家里呢', '我在家里吃饭呢'],
      ['他等你在门口', '他在门口等你'],
      ['我写作业在家', '我在家写作业'],
      ['我工作在ABC公司', '我在ABC公司工作'],
      ['我吃饭在我的房间', '我在我的房间吃饭'],
    ];
    for (const [wrong, right] of cases) {
      expect(codes(wrong), wrong).toEqual(['place_order']);
      expect(fixed(wrong), wrong).toBe(right);
    }
  });

  it('uses 把 with verbs of placing', () => {
    expect(fixed('我放书在桌子上')).toBe('我把书放在桌子上');
    expect(fixed('我挂衣服在墙上')).toBe('我把衣服挂在墙上');
    expect(run('我放书在桌子上')[0]?.message).toContain('把');
  });

  it('carries the corrections found inside the place', () => {
    expect(codes('我吃饭再家')).toEqual(['place_order', 'homophone_char']);
    expect(fixed('我吃饭再家')).toBe('我在家吃饭');
    expect(codes('我吃饭在里家')).toEqual(['place_order', 'localizer_order']);
    expect(fixed('我吃饭在里家')).toBe('我在家里吃饭');
  });

  it('stays silent on correct or uncertain sentences', () => {
    for (const text of [
      '我在家吃饭',
      '我住在河内',
      '书放在书包里',
      '我坐在椅子上',
      '我睡在床上',
      '我喜欢在家吃饭',
      '我看在桌子上的书',
      '我的工作在河内',
      '我的生日在五月',
      '我去学习在图书馆',
      '工作在城市里很难',
      '我吃饭在阮廌',
      '我在车站上车',
      '我在外地工作',
    ]) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('localizer_order', () => {
  it('puts the localizer after the noun', () => {
    expect(codes('猫在上桌子')).toEqual(['localizer_order']);
    expect(fixed('猫在上桌子')).toBe('猫在桌子上');
    expect(fixed('书在里书包')).toBe('书在书包里');
    expect(fixed('我在里家')).toBe('我在家里');
  });

  it('stays silent on words that start with a localizer', () => {
    for (const text of ['我在上海', '我在上课', '我在上车', '在里面', '我在外面', '我们在外面吃饭']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('missing_localizer', () => {
  it('adds the localizer an object needs', () => {
    expect(codes('猫在桌子')).toEqual(['missing_localizer']);
    expect(fixed('猫在桌子')).toBe('猫在桌子上');
    expect(fixed('书在书包')).toBe('书在书包里');
  });

  it('treats a bare object as a place only in answers to "where" questions', () => {
    const bare = runZhRules(analyzeZh('桌子', { locationQuestion: true }), free);
    expect(bare.map((i) => i.code)).toEqual(['missing_localizer']);
    for (const text of ['桌子', '椅子。', '一把椅子', '这是椅子', '我有一张桌子']) {
      expect(codes(text), text).toEqual([]);
    }
  });

  it("uses the question's localizer for the expected place", () => {
    const ctx: ZhRuleContext = { ...free, expectedPlaces: ['桌子'], expectedLocalizer: '下' };
    expect(fixed('猫在桌子', ctx)).toBe('猫在桌子下');
  });

  it('stays silent on places and complete phrases', () => {
    for (const text of ['我在家', '我在学校', '我在中国', '猫在桌子旁边', '书在桌子的上面', '我在桌子上写字']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('extra_localizer', () => {
  it('removes 里 after country and city names', () => {
    expect(codes('我在中国里')).toEqual(['extra_localizer']);
    expect(fixed('我在中国里')).toBe('我在中国');
    expect(fixed('我住在河内里')).toBe('我住在河内');
    expect(fixed('我住在中国里面')).toBe('我住在中国');
  });

  it('keeps 里 after ordinary places', () => {
    for (const text of ['我在家里', '我在学校里', '我住在中国北方']) {
      expect(codes(text), text).toEqual([]);
    }
  });
});

describe('homophone typos in places', () => {
  it('replaces 再 with 在 before a place', () => {
    const [issue] = run('我再家');
    expect(issue).toMatchObject({ code: 'homophone_char', start: 1, end: 2, penalty: 5 });
    expect(issue?.message).toContain('zài');
    expect(fixed('我再家')).toBe('我在家');
    for (const text of ['再见', '我再去学校', '我们再说']) expect(codes(text), text).toEqual([]);
  });

  it('corrects typos of the expected place', () => {
    const ctx: ZhRuleContext = { ...free, expectedPlaces: ['书包'] };
    expect(codes('书在书报里', ctx)).toEqual(['homophone_char']);
    expect(fixed('书在书报里', ctx)).toBe('书在书包里');
  });
});
