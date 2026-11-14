import { describe, expect, it } from 'vitest';
import type { ModelQuestion } from '../../src/core/types';
import { gradeZhModel, unitize } from '../../src/lang/zh/model';

const nationality: ModelQuestion = {
  id: 'test-nationality',
  lang: 'zh',
  type: 'model',
  prompt: '你是哪国人？',
  answers: ['(我)是越南人。', '越南人。'],
};
const thing: ModelQuestion = {
  id: 'test-thing',
  lang: 'zh',
  type: 'model',
  prompt: '这是什么？',
  answers: ['[这|这个]是(一个)苹果。', '(是)(一个)苹果。'],
};
const time: ModelQuestion = { id: 'test-time', lang: 'zh', type: 'model', prompt: '现在几点？', answers: ['(现在)(是)两点(钟)。'] };

describe('unitize', () => {
  it('turns numbers into single units', () => {
    expect(unitize('有4个').map((u) => u.key)).toEqual(['有', '#4', '个']);
    expect(unitize('有四个').map((u) => u.key)).toEqual(['有', '#4', '个']);
    expect(unitize('两三个').map((u) => u.key)).toEqual(['#2-3', '个']);
  });

  it('drops punctuation, leading interjections and trailing particles', () => {
    expect(unitize('嗯，我是越南人啊。').map((u) => u.surface).join('')).toBe('我是越南人');
    expect(unitize('啊').map((u) => u.surface)).toEqual(['啊']);
  });

  it('keeps words that only look like numbers', () => {
    expect(unitize('一起').map((u) => u.kind)).toEqual(['han', 'han']);
  });
});

describe('gradeZhModel', () => {
  it('accepts every expansion of the patterns', () => {
    for (const answer of ['这是苹果', '这个是苹果', '这是一个苹果', '这个是一个苹果', '是苹果', '是一个苹果', '一个苹果', '苹果']) {
      expect(gradeZhModel(thing, answer), answer).toMatchObject({ score: 100, content: { status: 'correct' } });
    }
  });

  it('tolerates homophone typos and gives the corrected answer', () => {
    expect(gradeZhModel(thing, '这是平果')).toMatchObject({ score: 95, corrected: '这是苹果。', issues: [{ code: 'homophone_char', start: 2 }] });
  });

  it('tolerates a missing function word', () => {
    const result = gradeZhModel(nationality, '我越南人');
    expect(result).toMatchObject({ score: 85, corrected: '我是越南人。', issues: [{ code: 'missing_word', start: 1, end: 1 }] });
  });

  it('uses the rules to repair the answer before comparing', () => {
    expect(gradeZhModel(thing, '这是一苹果')).toMatchObject({ score: 80, issues: [{ code: 'missing_measure_word' }] });
    expect(gradeZhModel(time, '现在二点')).toMatchObject({ score: 90, issues: [{ code: 'er_liang' }] });
  });

  it('accepts other spellings of the same number', () => {
    expect(gradeZhModel(time, '现在2点').score).toBe(100);
    const strict: ModelQuestion = { ...time, options: { allowArabicDigits: false } };
    expect(gradeZhModel(strict, '现在2点')).toMatchObject({ score: 95, issues: [{ code: 'arabic_digits' }] });
  });

  it('never tolerates a change of meaning', () => {
    for (const answer of ['这不是苹果', '我不是越南人', '现在三点']) {
      const q = answer.startsWith('我') ? nationality : answer.startsWith('现在') ? time : thing;
      expect(gradeZhModel(q, answer), answer).toMatchObject({ score: 0, content: { status: 'unmatched' }, needsReview: false });
    }
  });

  it('asks for a review when one ordinary character differs', () => {
    expect(gradeZhModel(thing, '这是芒果')).toMatchObject({ score: 0, needsReview: true, suggestion: '这是苹果。' });
    // 这 and 那 are not interchangeable function words.
    expect(gradeZhModel(thing, '那是苹果')).toMatchObject({ score: 0, needsReview: true });
    expect(gradeZhModel(thing, '这是香蕉')).toMatchObject({ score: 0, needsReview: false });
  });

  it('accepts a matching clause next to extra information, with a review flag', () => {
    expect(gradeZhModel(nationality, '我是越南人，我住在河内。')).toMatchObject({
      score: 100,
      needsReview: true,
      content: { status: 'correct', message: expect.stringContaining('chưa được kiểm tra') },
    });
    expect(gradeZhModel(nationality, '我是越喃人，我住在河内')).toMatchObject({
      score: 95,
      needsReview: true,
      corrected: '我是越南人，我住在河内',
    });
    expect(gradeZhModel(nationality, '我住在河内').content.status).toBe('unmatched');
  });

  it('still counts rule issues in the extra clauses', () => {
    expect(gradeZhModel(nationality, '我是越南人，我不有书')).toMatchObject({ score: 80, issues: [{ code: 'bu_you' }] });
  });

  it('uses per-answer scores', () => {
    const q: ModelQuestion = { ...nationality, answers: ['我是越南人。', { text: '越南人。', score: 80 }] };
    expect(gradeZhModel(q, '越南人')).toMatchObject({ score: 80, content: { message: 'Câu trả lời đúng.' } });
    expect(gradeZhModel(q, '我是越南人').content.message).toBe('Hoàn toàn chính xác!');
  });

  it('limits tolerated edits', () => {
    const q: ModelQuestion = { ...nationality, options: { maxLightEdits: 0 } };
    expect(gradeZhModel(q, '我越南人').content.status).toBe('unmatched');
  });

  it('handles empty and non-Chinese answers', () => {
    expect(gradeZhModel(thing, '')).toMatchObject({ score: 0, content: { status: 'no_answer' }, suggestion: '这是一个苹果。' });
    expect(gradeZhModel(thing, 'apple').content.message).toBe('Hãy trả lời bằng chữ Hán.');
  });
});
