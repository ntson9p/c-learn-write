import { describe, expect, it } from 'vitest';
import type { CountQuestion } from '../../src/core/types';
import { gradeZhCount } from '../../src/lang/zh/count';

const apples: CountQuestion = {
  id: 'test-apples',
  lang: 'zh',
  type: 'count',
  prompt: '图片里有几个绿苹果？',
  expected: { number: 4, noun: '苹果', colors: ['绿', '青'], sentence: '图片里有四个绿苹果。' },
};
const withOptions = (options: CountQuestion['options'], penalties?: Record<string, number>): CountQuestion => ({
  ...apples,
  options,
  ...(penalties ? { penalties } : {}),
});

describe('gradeZhCount: content', () => {
  it('accepts the right number in many forms', () => {
    for (const answer of ['图片里有四个绿苹果。', '有四个', '四个绿苹果', '有4个绿色的苹果', '一共有四个绿苹果', '我觉得有四个']) {
      expect(gradeZhCount(apples, answer), answer).toMatchObject({ score: 100, content: { status: 'correct' } });
    }
  });

  it('says what the learner claimed when the number is wrong', () => {
    const result = gradeZhCount(apples, '有五个绿苹果');
    expect(result).toMatchObject({ score: 20, content: { status: 'wrong' }, suggestion: '图片里有四个绿苹果。' });
    expect(result.content.message).toContain('5');
    expect(result.details).toMatchObject({ claim: 5, expected: 4 });
  });

  it('follows corrections such as 不是四个，是五个', () => {
    expect(gradeZhCount(apples, '不是五个，是四个').score).toBe(100);
    expect(gradeZhCount(apples, '不是四个，是五个').score).toBe(20);
  });

  it('separates the asked colour from other colours', () => {
    expect(gradeZhCount(apples, '有四个绿的，两个红的').score).toBe(100);
    const other = gradeZhCount(apples, '有两个红的');
    expect(other.score).toBe(20);
    expect(other.content.message).toContain('红苹果');
  });

  it('reads colours stated after the phrase', () => {
    expect(gradeZhCount(apples, '图片里有六个苹果，四个是绿的').score).toBe(100);
    expect(gradeZhCount(apples, '有四个，都是绿色的').score).toBe(100);
    expect(gradeZhCount(apples, '有六个苹果，两个是红的')).toMatchObject({ score: 20, details: { claim: 6 } });
  });

  it('names a different noun', () => {
    const result = gradeZhCount(apples, '有四个梨');
    expect(result.score).toBe(20);
    expect(result.content.message).toContain('梨');
  });

  it('asks a teacher to review a word one character away from the noun', () => {
    const result = gradeZhCount(apples, '有四个绿苹里');
    expect(result).toMatchObject({ score: 20, needsReview: true });
    expect(result.content.message).toContain('苹果');
  });

  it('understands "there are none"', () => {
    const none: CountQuestion = { ...apples, expected: { ...apples.expected, number: 0, sentence: '图片里没有绿苹果。' } };
    expect(gradeZhCount(none, '图片里没有绿苹果').score).toBe(100);
    expect(gradeZhCount(none, '有两个绿苹果').score).toBe(20);
    expect(gradeZhCount(apples, '没有绿苹果').details).toMatchObject({ claim: 0 });
    // 没有红苹果 says nothing about the green ones.
    expect(gradeZhCount(none, '没有红苹果').content.status).toBe('no_answer');
  });

  it('counts containers when the noun uses them', () => {
    const coffee: CountQuestion = { ...apples, expected: { number: 2, noun: '咖啡' } };
    expect(gradeZhCount(coffee, '有两杯咖啡').score).toBe(100);
    expect(gradeZhCount(coffee, '有两个咖啡')).toMatchObject({ score: 80, issues: [{ code: 'wrong_measure_word' }] });
    // 两口咖啡 is two mouthfuls, not two cups: still wrong when counting cups.
    expect(gradeZhCount(coffee, '有两口咖啡')).toMatchObject({ score: 80, issues: [{ code: 'wrong_measure_word' }] });
    expect(gradeZhCount(coffee, '有两种咖啡').content.status).toBe('no_answer');
  });

  it('builds a model sentence when the question has none', () => {
    const cats: CountQuestion = { ...apples, expected: { number: 2, noun: '猫' } };
    expect(gradeZhCount(cats, '有三只猫').suggestion).toBe('有两只猫。');
  });

  it('handles empty and non-Chinese answers', () => {
    expect(gradeZhCount(apples, '   ')).toMatchObject({ score: 0, content: { status: 'no_answer', message: 'Bạn chưa nhập câu trả lời.' } });
    expect(gradeZhCount(apples, 'four')).toMatchObject({ score: 0, content: { message: 'Hãy trả lời bằng chữ Hán.' } });
    expect(gradeZhCount(apples, '4').score).toBe(80); // a bare number: missing measure word
  });
});

describe('gradeZhCount: language issues', () => {
  it('builds a corrected answer', () => {
    expect(gradeZhCount(apples, '有四本苹果').corrected).toBe('有四个苹果');
    expect(gradeZhCount(apples, '有四个平果绿').corrected).toBe('有四个绿苹果');
    expect(gradeZhCount(apples, '有四个绿苹果').corrected).toBeUndefined();
  });

  it('recognises homophone typos in the colour word', () => {
    // 率 can be read lǜ, like 绿.
    expect(gradeZhCount(apples, '有四个率苹果')).toMatchObject({
      score: 95,
      corrected: '有四个绿苹果',
      issues: [{ code: 'homophone_char', start: 3, end: 4 }],
    });
  });

  it('adds penalties up', () => {
    const result = gradeZhCount(apples, '有四本平果绿');
    expect(result.issues.map((i) => i.code)).toEqual(['wrong_measure_word', 'homophone_char', 'modifier_order']);
    expect(result.score).toBe(55);
  });

  it('caps the score of a wrong answer', () => {
    expect(gradeZhCount(apples, '有五本苹果').score).toBe(20);
  });
});

describe('gradeZhCount: options', () => {
  it('can require a full sentence', () => {
    const q = withOptions({ requireFullSentence: true });
    expect(gradeZhCount(q, '四个绿苹果')).toMatchObject({ score: 80, issues: [{ code: 'not_full_sentence' }] });
    expect(gradeZhCount(q, '有四个绿苹果').score).toBe(100);
  });

  it('can require Chinese numerals', () => {
    const q = withOptions({ allowArabicDigits: false });
    expect(gradeZhCount(q, '有4个绿苹果')).toMatchObject({ score: 95, corrected: '有四个绿苹果' });
  });

  it('can change the score of wrong answers and the penalties', () => {
    expect(gradeZhCount(withOptions({ wrongContentScore: 0 }), '有五个').score).toBe(0);
    expect(gradeZhCount(withOptions({}, { missing_measure_word: 30 }), '有四苹果').score).toBe(70);
  });
});

describe('count: expected noun after unknown characters', () => {
  const q: CountQuestion = {
    id: 'doctors',
    lang: 'zh',
    type: 'count',
    prompt: '图片里有几个医生？',
    expected: { number: 2, noun: '医生' },
  };
  it('accepts 两个女医生 but asks for a teacher review', () => {
    const r = gradeZhCount(q, '有两个女医生。');
    expect(r.content.status).toBe('correct');
    expect(r.score).toBe(100);
    expect(r.needsReview).toBe(true);
  });
  it('keeps plain answers without review', () => {
    expect(gradeZhCount(q, '有两个医生。')).toMatchObject({ score: 100, needsReview: false });
  });
});
