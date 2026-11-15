import { describe, expect, it } from 'vitest';
import type { LocationQuestion } from '../../src/core/types';
import { gradeZhLocation } from '../../src/lang/zh/location';

const book: LocationQuestion = {
  id: 'test-book',
  lang: 'zh',
  type: 'location',
  prompt: '书在哪儿？',
  expected: { places: ['书包', '包'], localizer: '里', sentence: '书在书包里。' },
};
const eat: LocationQuestion = {
  id: 'test-eat',
  lang: 'zh',
  type: 'location',
  prompt: '你在哪儿吃饭？',
  expected: { sentence: '我在家吃饭。' },
};

describe('gradeZhLocation: picture questions', () => {
  it('accepts the right place in many forms', () => {
    for (const answer of [
      '书在书包里',
      '在书包里',
      '书包里',
      '书在书包里面',
      '书在书包的里面',
      '书放在书包里',
      '书包里有一本书',
      '书在桌子上的书包里',
      '书在包里',
    ]) {
      expect(gradeZhLocation(book, answer), answer).toMatchObject({ score: 100, content: { status: 'correct' } });
    }
  });

  it('treats the localizer as part of the place', () => {
    const result = gradeZhLocation(book, '书在书包上');
    expect(result).toMatchObject({ score: 20, content: { status: 'wrong' }, suggestion: '书在书包里。' });
    expect(result.content.message).toContain('书包上');
    expect(gradeZhLocation(book, '书在书包外面').score).toBe(20);
  });

  it('treats a missing localizer as a language issue only', () => {
    expect(gradeZhLocation(book, '书在书包')).toMatchObject({
      score: 80,
      content: { status: 'correct' },
      corrected: '书在书包里',
      issues: [{ code: 'missing_localizer' }],
    });
  });

  it('rejects other places, negations and answers without a place', () => {
    expect(gradeZhLocation(book, '书在桌子上')).toMatchObject({ score: 20, content: { status: 'wrong' } });
    expect(gradeZhLocation(book, '书不在书包里')).toMatchObject({
      score: 20,
      content: { message: expect.stringContaining('phủ định') },
    });
    expect(gradeZhLocation(book, '我喜欢看书')).toMatchObject({ score: 0, content: { status: 'no_answer' } });
  });

  it('asks for a review when other places are mentioned too', () => {
    expect(gradeZhLocation(book, '书在书包里，书包在桌子上')).toMatchObject({ score: 100, needsReview: true });
  });

  it('asks for a review for a word one character away from the place', () => {
    const result = gradeZhLocation(book, '书在书巴里');
    expect(result).toMatchObject({ score: 20, needsReview: true });
    expect(result.content.message).toContain('书包');
  });
});

describe('gradeZhLocation: personal questions', () => {
  it('accepts any place', () => {
    for (const answer of ['我在家吃饭', '我在学校吃饭', '我在我的房间吃饭', '我在阿明家吃饭', '我回家吃饭', '在外面']) {
      expect(gradeZhLocation(eat, answer), answer).toMatchObject({ score: 100, needsReview: false });
    }
  });

  it('accepts an unknown name but asks for a review', () => {
    const result = gradeZhLocation(eat, '我在阮廌吃饭');
    expect(result).toMatchObject({ score: 100, needsReview: true, content: { status: 'correct' } });
    expect(result.content.message).toContain('阮廌');
  });

  it('needs a place', () => {
    for (const answer of ['我在吃饭', '我在晚上吃饭', '我喜欢吃饭']) {
      expect(gradeZhLocation(eat, answer), answer).toMatchObject({ score: 0, content: { status: 'no_answer' } });
    }
    expect(gradeZhLocation(eat, '我不在家吃饭')).toMatchObject({ score: 20, content: { status: 'wrong' } });
  });

  it('grades the language', () => {
    expect(gradeZhLocation(eat, '我吃饭在家')).toMatchObject({ score: 80, corrected: '我在家吃饭' });
    expect(gradeZhLocation(eat, '我吃饭在里家')).toMatchObject({ score: 60, corrected: '我在家里吃饭' });
  });
});

describe('gradeZhLocation: options', () => {
  it('can change the score of wrong answers and the penalties', () => {
    expect(gradeZhLocation({ ...book, options: { wrongContentScore: 0 } }, '书在桌子上').score).toBe(0);
    expect(gradeZhLocation({ ...eat, penalties: { place_order: 30 } }, '我吃饭在家').score).toBe(70);
  });

  it('handles empty and non-Chinese answers', () => {
    expect(gradeZhLocation(book, '')).toMatchObject({ score: 0, content: { status: 'no_answer' }, suggestion: '书在书包里。' });
    expect(gradeZhLocation(book, 'in the bag').content.message).toBe('Hãy trả lời bằng chữ Hán.');
  });
});

describe('location: missing directional localizer', () => {
  const q: LocationQuestion = {
    id: 'station',
    lang: 'zh',
    type: 'location',
    prompt: '地铁站在哪儿？',
    expected: { places: ['学校'], localizer: '前' },
  };
  it('flags 在学校 for review when the picture says 在学校前边', () => {
    const r = gradeZhLocation(q, '地铁站在学校。');
    expect(r.content.status).toBe('correct');
    expect(r.needsReview).toBe(true);
    expect(gradeZhLocation(q, '地铁站在学校前边。').needsReview).toBe(false);
  });
});
