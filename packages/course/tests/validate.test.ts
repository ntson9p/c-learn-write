import { describe, expect, it } from 'vitest';
import type { CurriculumLesson, LessonContent, OfficialGrammar, OfficialWord } from '../src/types';
import { canBuild, validateCourse, type CourseData } from '../src/validate';
import { readingsOf } from '../src/readings';

const word = (no: number, w: string, pinyin: string, level = 1): OfficialWord => ({
  no, level, word: w, pinyin, syllables: [], pos: [], hanViet: '',
});
const vocabulary = [word(1, '我', 'wǒ'), word(2, '是', 'shì'), word(3, '学生', 'xuésheng'), word(4, '你', 'nǐ'), word(5, '好', 'hǎo')];
const grammar: OfficialGrammar[] = [{ no: 1, level: 1, category: '', categoryName: '', item: '', content: '是' }];
const curriculum: CurriculumLesson[] = [
  { id: 'hsk1-01', level: 1, order: 1, titleVi: 'A', topicVi: 'A', words: [1, 2, 3], grammar: [1] },
  { id: 'hsk1-02', level: 1, order: 2, titleVi: 'B', topicVi: 'B', words: [4, 5], grammar: [] },
];
const draft = { status: 'draft' as const };
const lesson1 = (): LessonContent => ({
  id: 'hsk1-01',
  goalsVi: ['Nói mình là học sinh'],
  words: [
    { no: 1, word: '我', meaningsVi: ['tôi'], examples: [{ zh: '我是学生。', py: 'wǒ shì xué shēng', vi: 'Tôi là học sinh.' }], review: draft },
    { no: 2, word: '是', meaningsVi: ['là'], examples: [{ zh: '我是学生。', py: 'wǒ shì xué shēng', vi: 'Tôi là học sinh.' }], review: draft },
    { no: 3, word: '学生', meaningsVi: ['học sinh'], examples: [{ zh: '我是学生。', py: 'wǒ shì xué shēng', vi: 'Tôi là học sinh.' }], review: draft },
  ],
  grammar: [
    { no: 1, titleVi: 'Câu chữ 是', summaryVi: 'A 是 B', explanationVi: ['…'], examples: [{ zh: '我是学生。', py: 'wǒ shì xué shēng', vi: 'Tôi là học sinh.' }], review: draft },
  ],
  exercises: [
    { id: 'hsk1-01-e01', type: 'order', vi: 'Tôi là học sinh.', tiles: ['学生', '我', '是'], answers: ['我是学生'], grammar: [1] },
    { id: 'hsk1-01-e02', type: 'choice', promptVi: '「我」 là gì?', options: ['tôi', 'bạn'], answer: 0 },
    { id: 'hsk1-01-e03', type: 'translate', vi: 'Tôi là học sinh.', answers: ['我是学生。'], examples: [{ answer: '我是学生。', score: 100 }], grammar: [1] },
  ],
});
const data = (contents: LessonContent[], levels: CourseData['levels'] = {}): CourseData => ({
  vocabulary, grammar, names: [], curriculum, contents, levels,
});

describe('validateCourse', () => {
  it('accepts a correct lesson', () => {
    expect(validateCourse(data([lesson1()]), readingsOf)).toEqual([]);
  });

  it('reports words that are taught later or unknown', () => {
    const l = lesson1();
    l.words[0]!.examples = [{ zh: '你好，我是学生。', py: 'nǐ hǎo wǒ shì xué shēng', vi: '…' }];
    l.words[1]!.examples = [{ zh: '我是老学生。', py: 'wǒ shì lǎo xué shēng', vi: '…' }];
    const errors = validateCourse(data([l]), readingsOf);
    expect(errors).toContain('hsk1-01 word 1 example 1: 「你」 is taught later (hsk1-02) in 「你好，我是学生。」');
    expect(errors).toContain('hsk1-01 word 2 example 1: unknown word 「老」 in 「我是老学生。」');
  });

  it('reports wrong or missing pinyin', () => {
    const l = lesson1();
    l.words[0]!.examples = [{ zh: '我是学生。', py: 'wǒ shì xué', vi: '…' }];
    l.words[1]!.examples = [{ zh: '我是学生。', py: 'nǐ shì xué shēng', vi: '…' }];
    const errors = validateCourse(data([l]), readingsOf);
    expect(errors.some((e) => e.includes('3 syllables for 4 characters'))).toBe(true);
    expect(errors.some((e) => e.includes('「我」 cannot be read "nǐ"'))).toBe(true);
  });

  it('checks exercises', () => {
    const l = lesson1();
    l.exercises = [
      { id: 'hsk1-01-e01', type: 'order', vi: '…', tiles: ['学生', '我', '是'], answers: ['我是老师'] },
      { id: 'hsk1-01-e01', type: 'choice', promptVi: '…', options: ['a', 'a'], answer: 2 },
      { id: 'hsk1-01-e03', type: 'translate', vi: '…', answers: ['我是学生。'], examples: [{ answer: '我学生。', score: 100 }] },
    ];
    const errors = validateCourse(data([l]), readingsOf);
    expect(errors).toContain('hsk1-01 exercise hsk1-01-e01: answer 「我是老师」 cannot be built from the tiles');
    expect(errors).toContain('hsk1-01 exercise hsk1-01-e01: duplicate exercise id');
    expect(errors).toContain('hsk1-01 exercise hsk1-01-e01: options must differ');
    expect(errors).toContain('hsk1-01 exercise hsk1-01-e01: answer must index an option');
    expect(errors).toContain('hsk1-01 exercise hsk1-01-e03: example 「我学生。」 scores 85, expected 100');
  });

  it('requires the curriculum words and full coverage of complete levels', () => {
    const l = lesson1();
    l.words = l.words.slice(0, 2);
    const errors = validateCourse(data([l], { '1': 'complete' }), readingsOf);
    expect(errors).toContain('hsk1-01: words must be the curriculum words: missing 3, extra -');
    expect(errors).toContain('hsk1-02: lesson content is missing');
    expect(errors).toContain('hsk1: grammar 1 needs at least 3 exercises, has 2');
  });

  it('canBuild uses every tile once', () => {
    expect(canBuild('我是学生', ['学生', '我', '是'])).toBe(true);
    expect(canBuild('我是', ['学生', '我', '是'])).toBe(false);
    expect(canBuild('我我', ['我'])).toBe(false);
  });
});
