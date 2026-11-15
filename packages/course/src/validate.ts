/**
 * Checks all course content and returns a list of problems (empty = valid).
 * Run by the tests, so `npm run check` fails on any content mistake.
 */
import { expandPattern, grade, PatternError, validateQuestion, type ModelQuestion, type Question } from '@c-learn-write/grader';
import { stripTones } from './pinyin.ts';
import { Segmenter } from './segment.ts';
import type {
  CurriculumLesson,
  Exercise,
  GrammarContent,
  LessonContent,
  LevelStatus,
  NameEntry,
  OfficialGrammar,
  OfficialWord,
  Review,
  Sentence,
  WordContent,
} from './types.ts';

export interface CourseData {
  vocabulary: readonly OfficialWord[];
  grammar: readonly OfficialGrammar[];
  names: readonly NameEntry[];
  /** data/curriculum.json: which lesson teaches what. */
  curriculum: readonly CurriculumLesson[];
  /** Lesson files written so far. */
  contents: readonly LessonContent[];
  levels: Readonly<Record<string, LevelStatus>>;
}

type Lesson = CurriculumLesson;

export type ReadingsOf = (ch: string) => readonly string[];

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const SENTENCE_END = /[。！？…）」]$/u;
const REVIEW_STATUS = new Set(['draft', 'approved', 'changes_requested']);
/** Lesson position, for "taught before" comparisons. */
const rank = (l: Pick<Lesson, 'level' | 'order'>) => l.level * 1000 + l.order;

/** The grader question of a translate exercise. */
export function translateQuestion(ex: Extract<Exercise, { type: 'translate' }>): ModelQuestion {
  return {
    id: ex.id,
    lang: 'zh',
    type: 'model',
    prompt: ex.vi,
    promptVi: ex.vi,
    answers: ex.answers,
    ...(ex.examples ? { examples: ex.examples } : {}),
  };
}

/** The grader question of a question exercise. */
export function exerciseQuestion(ex: Extract<Exercise, { type: 'question' }>): Question {
  return { ...ex.question, id: ex.id, lang: 'zh' } as Question;
}

/** Chinese text of an exercise that learners read (for vocabulary control). */
export function exerciseTexts(ex: Exercise): string[] {
  switch (ex.type) {
    case 'choice':
      return [ex.zh ?? '', ...ex.options];
    case 'fill':
      return [ex.before + ex.answers[0] + ex.after, ...(ex.options ?? [])];
    case 'order':
      return [...ex.tiles, ...ex.answers];
    case 'translate':
      return ex.answers.flatMap((a) => expandPattern(typeof a === 'string' ? a : a.text).slice(0, 4));
    case 'question': {
      const q = ex.question;
      const extra = 'expected' in q && q.expected.sentence ? [q.expected.sentence] : [];
      const answers = q.type === 'model' ? q.answers.flatMap((a) => expandPattern(typeof a === 'string' ? a : a.text).slice(0, 4)) : [];
      return [q.prompt, ...extra, ...answers];
    }
    case 'match':
      return ex.pairs.map((p) => p[0]);
  }
}

export function validateCourse(data: CourseData, readingsOf: ReadingsOf): string[] {
  const errors: string[] = [];
  const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

  const wordByNo = new Map(data.vocabulary.map((w) => [w.no, w]));
  const grammarByNo = new Map(data.grammar.map((g) => [g.no, g]));
  const nameByZh = new Map(data.names.map((n) => [n.zh, n]));

  // Where is each word / grammar point taught? (curriculum)
  const wordLesson = new Map<number, Lesson>();
  const grammarLesson = new Map<number, Lesson>();
  const lessonById = new Map<string, Lesson>();
  const levelOrders = new Map<number, number[]>();
  for (const lesson of data.curriculum) {
    if (lessonById.has(lesson.id)) err(lesson.id, 'duplicate lesson id in the curriculum');
    lessonById.set(lesson.id, lesson);
    levelOrders.set(lesson.level, [...(levelOrders.get(lesson.level) ?? []), lesson.order]);
    if (lesson.id !== `hsk${lesson.level}-${String(lesson.order).padStart(2, '0')}`) err(lesson.id, 'id must be hsk<level>-<order, 2 digits>');
    for (const key of ['titleVi', 'topicVi'] as const) if (!nonEmpty(lesson[key])) err(lesson.id, `${key} is required`);
    if (lesson.words.length === 0) err(lesson.id, 'a lesson needs words');
    for (const no of lesson.words) {
      const official = wordByNo.get(no);
      if (!official) err(lesson.id, `word ${no} is not in the syllabus`);
      else if (official.level !== lesson.level) err(lesson.id, `word ${no} ${official.word} is HSK${official.level}`);
      const before = wordLesson.get(no);
      if (before) err(lesson.id, `word ${no} is already taught in ${before.id}`);
      else wordLesson.set(no, lesson);
    }
    for (const no of lesson.grammar) {
      const official = grammarByNo.get(no);
      if (!official) err(lesson.id, `grammar ${no} is not in the syllabus`);
      else if (official.level !== lesson.level) err(lesson.id, `grammar ${no} is HSK${official.level}`);
      const before = grammarLesson.get(no);
      if (before) err(lesson.id, `grammar ${no} is already taught in ${before.id}`);
      else grammarLesson.set(no, lesson);
    }
  }
  for (const [level, orders] of levelOrders) {
    const sorted = [...orders].sort((a, b) => a - b);
    if (sorted.some((o, i) => o !== i + 1)) err(`hsk${level}`, `lesson orders must be 1..${orders.length}, got ${sorted.join(',')}`);
  }

  // Dictionary for segmentation: every syllabus word, name and taught morpheme.
  const morphemeLesson = new Map<string, Lesson>();
  for (const content of data.contents) {
    const lesson = lessonById.get(content.id);
    if (lesson) for (const g of content.grammar ?? []) for (const m of g.morphemes ?? []) morphemeLesson.set(m, lesson);
  }
  const firstLessonOf = new Map<string, Lesson>();
  for (const w of data.vocabulary) {
    const lesson = wordLesson.get(w.no);
    if (!lesson) continue;
    const seen = firstLessonOf.get(w.word);
    if (!seen || rank(lesson) < rank(seen)) firstLessonOf.set(w.word, lesson);
  }
  const segmenter = new Segmenter([...data.vocabulary.map((w) => w.word), ...data.names.map((n) => n.zh), ...morphemeLesson.keys()]);

  /** Words of `text` that are unknown or taught after `lesson`. */
  const vocabProblems = (text: string, lesson: Lesson): string[] => {
    const out: string[] = [];
    for (const t of segmenter.segment(text)) {
      if (nameByZh.has(t.text)) continue;
      if (!t.known) {
        out.push(`unknown word 「${t.text}」`);
        continue;
      }
      const taught = firstLessonOf.get(t.text) ?? morphemeLesson.get(t.text);
      if (!taught) out.push(`「${t.text}」 is not taught in any lesson yet`);
      else if (rank(taught) > rank(lesson)) out.push(`「${t.text}」 is taught later (${taught.id})`);
    }
    return out;
  };

  const checkReview = (where: string, r: Review | undefined, required: boolean) => {
    if (!r) {
      if (required) err(where, 'missing review');
      return;
    }
    if (!REVIEW_STATUS.has(r.status)) err(where, `bad review status "${String(r.status)}"`);
    if (r.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) err(where, 'review.date must be YYYY-MM-DD');
  };

  /** Pinyin of a sentence: one valid reading per Han character. */
  const checkPinyin = (where: string, s: Sentence) => {
    const hans = [...s.zh].filter(isHan);
    if (!nonEmpty(s.py)) {
      err(where, `missing pinyin for 「${s.zh}」 (run npm run content:fill)`);
      return;
    }
    const syl = s.py.trim().split(/\s+/);
    if (syl.length !== hans.length) {
      err(where, `pinyin has ${syl.length} syllables for ${hans.length} characters in 「${s.zh}」 (run npm run content:fill)`);
      return;
    }
    hans.forEach((ch, i) => {
      const plain = stripTones(syl[i]!);
      const ok = readingsOf(ch).includes(plain) || (ch === '儿' && plain === 'r');
      if (!ok) err(where, `「${ch}」 cannot be read "${syl[i]}" in 「${s.zh}」`);
    });
  };

  const checkSentence = (where: string, s: Sentence, lesson: Lesson) => {
    if (!nonEmpty(s.zh) || ![...s.zh].some(isHan)) err(where, 'sentence needs Chinese text');
    else if (!SENTENCE_END.test(s.zh)) err(where, `「${s.zh}」 must end with 。！？`);
    if (!nonEmpty(s.vi)) err(where, `「${s.zh}」 needs a Vietnamese translation`);
    checkPinyin(where, s);
    for (const p of vocabProblems(s.zh ?? '', lesson)) err(where, `${p} in 「${s.zh}」`);
  };

  const exerciseIds = new Set<string>();
  const grammarExerciseCount = new Map<number, number>();

  const contentIds = new Set<string>();
  for (const content of data.contents) {
    const lesson = lessonById.get(content.id);
    if (!lesson) {
      err(String(content.id), 'lesson file has no curriculum entry');
      continue;
    }
    if (contentIds.has(content.id)) err(content.id, 'duplicate lesson file');
    contentIds.add(content.id);
    if (!Array.isArray(content.goalsVi) || content.goalsVi.length === 0 || !content.goalsVi.every(nonEmpty)) err(lesson.id, 'goalsVi needs at least one goal');
    const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);
    const words = (content.words ?? []).map((w) => w.no);
    if (!sameSet(words, lesson.words)) err(lesson.id, `words must be the curriculum words: missing ${lesson.words.filter((n) => !words.includes(n)).join(',') || '-'}, extra ${words.filter((n) => !lesson.words.includes(n)).join(',') || '-'}`);
    const grammars = (content.grammar ?? []).map((g) => g.no);
    if (!sameSet(grammars, lesson.grammar)) err(lesson.id, `grammar must be the curriculum points: missing ${lesson.grammar.filter((n) => !grammars.includes(n)).join(',') || '-'}, extra ${grammars.filter((n) => !lesson.grammar.includes(n)).join(',') || '-'}`);

    for (const w of content.words ?? []) checkWord(w, lesson);
    for (const g of content.grammar ?? []) checkGrammar(g, lesson);
    for (const ex of content.exercises ?? []) checkExercise(ex, lesson);
  }

  function checkWord(w: WordContent, lesson: Lesson) {
    const where = `${lesson.id} word ${w.no}`;
    const official = wordByNo.get(w.no);
    if (!official) return err(where, 'not in the syllabus');
    if (official.word !== w.word) err(where, `word must be ${official.word}, got ${w.word}`);
    if (official.level !== lesson.level) err(where, `is an HSK${official.level} word, lesson is HSK${lesson.level}`);
    if (!Array.isArray(w.meaningsVi) || w.meaningsVi.length === 0 || !w.meaningsVi.every(nonEmpty)) err(where, 'meaningsVi needs at least one meaning');
    if (w.noteVi !== undefined && !nonEmpty(w.noteVi)) err(where, 'noteVi must be text');
    if (!Array.isArray(w.examples) || w.examples.length === 0) err(where, 'needs at least one example');
    (w.examples ?? []).forEach((s, i) => {
      checkSentence(`${where} example ${i + 1}`, s, lesson);
      if (!s.zh?.includes(w.word)) err(`${where} example ${i + 1}`, `example should contain 「${w.word}」`);
    });
    checkReview(where, w.review, true);
  }

  function checkGrammar(g: GrammarContent, lesson: Lesson) {
    const where = `${lesson.id} grammar ${g.no}`;
    const official = grammarByNo.get(g.no);
    if (!official) return err(where, 'not in the syllabus');
    if (official.level !== lesson.level) err(where, `is an HSK${official.level} point, lesson is HSK${lesson.level}`);
    for (const key of ['titleVi', 'summaryVi'] as const) if (!nonEmpty(g[key])) err(where, `${key} is required`);
    if (!Array.isArray(g.explanationVi) || g.explanationVi.length === 0 || !g.explanationVi.every(nonEmpty)) err(where, 'explanationVi needs paragraphs');
    if (!Array.isArray(g.examples) || g.examples.length === 0) err(where, 'needs at least one example');
    (g.examples ?? []).forEach((s, i) => checkSentence(`${where} example ${i + 1}`, s, lesson));
    for (const [i, m] of (g.mistakes ?? []).entries()) {
      if (!nonEmpty(m.wrong) || !nonEmpty(m.right) || !nonEmpty(m.noteVi)) err(`${where} mistake ${i + 1}`, 'wrong, right and noteVi are required');
      if (m.wrong === m.right) err(`${where} mistake ${i + 1}`, 'wrong and right are the same');
      for (const p of vocabProblems(m.right ?? '', lesson)) err(`${where} mistake ${i + 1}`, `${p} in 「${m.right}」`);
    }
    for (const m of g.morphemes ?? []) if (!nonEmpty(m) || ![...m].every(isHan)) err(where, `bad morpheme "${m}"`);
    checkReview(where, g.review, true);
  }

  function checkExercise(ex: Exercise, lesson: Lesson) {
    const where = `${lesson.id} exercise ${ex.id ?? '?'}`;
    if (!nonEmpty(ex.id) || !new RegExp(`^${lesson.id}-e\\d{2}$`).test(ex.id)) err(where, `id must be ${lesson.id}-eNN`);
    if (exerciseIds.has(ex.id)) err(where, 'duplicate exercise id');
    exerciseIds.add(ex.id);
    for (const no of ex.grammar ?? []) {
      const taught = grammarLesson.get(no);
      if (!grammarByNo.has(no)) err(where, `grammar ${no} is not in the syllabus`);
      else if (!taught) err(where, `grammar ${no} is not taught in any lesson`);
      else if (rank(taught) > rank(lesson)) err(where, `grammar ${no} is taught later (${taught.id})`);
      grammarExerciseCount.set(no, (grammarExerciseCount.get(no) ?? 0) + 1);
    }
    checkReview(where, ex.review, false);

    switch (ex.type) {
      case 'choice': {
        if (!nonEmpty(ex.promptVi)) err(where, 'promptVi is required');
        if (!Array.isArray(ex.options) || ex.options.length < 2 || !ex.options.every(nonEmpty)) err(where, 'needs at least 2 options');
        else if (new Set(ex.options).size !== ex.options.length) err(where, 'options must differ');
        if (!Number.isInteger(ex.answer) || ex.answer < 0 || ex.answer >= (ex.options?.length ?? 0)) err(where, 'answer must index an option');
        break;
      }
      case 'fill': {
        if (typeof ex.before !== 'string' || typeof ex.after !== 'string') err(where, 'before and after are required');
        if (!Array.isArray(ex.answers) || ex.answers.length === 0 || !ex.answers.every(nonEmpty)) err(where, 'needs answers');
        if (ex.options && !ex.answers.every((a) => ex.options!.includes(a))) err(where, 'every answer must be one of the options');
        if (ex.options && new Set(ex.options).size !== ex.options.length) err(where, 'options must differ');
        if (!SENTENCE_END.test(ex.after)) err(where, 'after must end the sentence (。！？)');
        break;
      }
      case 'order': {
        if (!nonEmpty(ex.vi)) err(where, 'vi is required');
        if (!Array.isArray(ex.tiles) || ex.tiles.length < 2 || !ex.tiles.every(nonEmpty)) err(where, 'needs at least 2 tiles');
        if (!Array.isArray(ex.answers) || ex.answers.length === 0) err(where, 'needs answers');
        const tileKey = [...(ex.tiles ?? [])].sort().join('|');
        for (const a of ex.answers ?? []) {
          if (!canBuild(a, ex.tiles ?? [])) err(where, `answer 「${a}」 cannot be built from the tiles`);
        }
        if (new Set(ex.answers).size !== (ex.answers ?? []).length) err(where, 'answers must differ');
        if (tileKey && ex.answers?.some((a) => /[。！？，]/.test(a))) err(where, 'answers have no punctuation');
        break;
      }
      case 'translate': {
        if (!nonEmpty(ex.vi)) err(where, 'vi is required');
        const q = translateQuestion(ex);
        for (const e of validateQuestion(q)) err(where, e);
        for (const sample of ex.examples ?? []) {
          const r = grade(q, sample.answer);
          if (r.score !== sample.score) err(where, `example 「${sample.answer}」 scores ${r.score}, expected ${sample.score}`);
        }
        try {
          const first = ex.answers[0];
          const best = first === undefined ? [] : expandPattern(typeof first === 'string' ? first : first.text);
          if (best[0] && grade(q, best[0]).score !== (typeof first === 'string' ? 100 : (first?.score ?? 100))) err(where, 'the first answer must score full marks');
        } catch (e) {
          if (!(e instanceof PatternError)) throw e;
        }
        break;
      }
      case 'question': {
        const q = exerciseQuestion(ex);
        for (const e of validateQuestion(q)) err(where, e);
        for (const sample of q.examples ?? []) {
          const r = grade(q, sample.answer);
          if (r.score !== sample.score) err(where, `example 「${sample.answer}」 scores ${r.score}, expected ${sample.score}`);
        }
        if ((q.type === 'count' || q.type === 'location') && q.expected.sentence && grade(q, q.expected.sentence).score !== 100) {
          err(where, 'the model sentence must score 100');
        }
        break;
      }
      case 'match': {
        if (!nonEmpty(ex.promptVi)) err(where, 'promptVi is required');
        if (!Array.isArray(ex.pairs) || ex.pairs.length < 2) err(where, 'needs at least 2 pairs');
        else {
          const left = ex.pairs.map((p) => p[0]);
          const right = ex.pairs.map((p) => p[1]);
          if (new Set(left).size !== left.length || new Set(right).size !== right.length) err(where, 'pair sides must differ');
        }
        break;
      }
      default:
        err(where, `unknown exercise type "${(ex as { type?: string }).type}"`);
        return;
    }
    for (const text of exerciseTexts(ex)) for (const p of vocabProblems(text, lesson)) err(where, `${p} in 「${text}」`);
  }

  // Complete levels: every word and grammar point is in a written lesson, with exercises.
  for (const [levelKey, status] of Object.entries(data.levels)) {
    if (status !== 'complete') continue;
    const level = Number(levelKey);
    for (const lesson of data.curriculum.filter((l) => l.level === level)) {
      if (!contentIds.has(lesson.id)) err(lesson.id, 'lesson content is missing');
    }
    for (const w of data.vocabulary.filter((v) => v.level === level)) {
      if (!wordLesson.has(w.no)) err(`hsk${level}`, `word ${w.no} ${w.word} is not in the curriculum`);
    }
    for (const g of data.grammar.filter((v) => v.level === level)) {
      if (!grammarLesson.has(g.no)) err(`hsk${level}`, `grammar ${g.no} (${g.content}) is not in the curriculum`);
      else if ((grammarExerciseCount.get(g.no) ?? 0) < 3) err(`hsk${level}`, `grammar ${g.no} needs at least 3 exercises, has ${grammarExerciseCount.get(g.no) ?? 0}`);
    }
  }
  return errors;
}

/** True when `answer` is exactly the concatenation of all tiles in some order. */
export function canBuild(answer: string, tiles: readonly string[]): boolean {
  const used = new Array(tiles.length).fill(false);
  const go = (rest: string, left: number): boolean => {
    if (left === 0) return rest === '';
    for (let i = 0; i < tiles.length; i++) {
      if (used[i] || !rest.startsWith(tiles[i]!)) continue;
      used[i] = true;
      if (go(rest.slice(tiles[i]!.length), left - 1)) return true;
      used[i] = false;
    }
    return false;
  };
  return go(answer, tiles.length);
}
