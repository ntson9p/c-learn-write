/**
 * Checking every exercise type (deterministic) and generating vocabulary
 * drills from a lesson's words. Free answers go through the grader.
 */
import { exerciseQuestion, hashString, translateQuestion, type Exercise, type OfficialWord, type WordContent } from '@c-learn-write/course';
import { checkZhSentence, grade, normalizeZh, type GradeResult, type Issue } from '@c-learn-write/grader';

/** A free answer counts as right from this score. */
export const PASS_SCORE = 80;

export type Answer =
  | { type: 'choice'; index: number }
  | { type: 'fill'; text: string }
  | { type: 'order'; tiles: string[] }
  | { type: 'text'; text: string }
  | { type: 'match'; mistakes: number };

export interface Outcome {
  correct: boolean;
  /** 0-100. */
  score: number;
  /** Grader result for free answers. */
  result?: GradeResult;
  /** Rule findings that explain a wrong word order. */
  issues?: Issue[];
  /** The expected answer to show after a mistake. */
  expected?: string;
}

/** Text without punctuation, spaces or letter case, after the grader's normalization. */
export function plainText(text: string): string {
  return normalizeZh(text)
    .text.replace(/[\p{P}\p{S}\s]/gu, '')
    .toLowerCase();
}

/** Seeded pseudo-random numbers (mulberry32): the same seed gives the same drill. */
export function rng(seed: string): () => number {
  let a = parseInt(hashString(seed), 16) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  const r = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Tiles in an order that is not already an accepted answer (when possible). */
export function shuffledTiles(ex: Extract<Exercise, { type: 'order' }>): string[] {
  for (let k = 0; k < 8; k++) {
    const t = shuffle(ex.tiles, `${ex.id}#${k}`);
    if (!ex.answers.includes(t.join(''))) return t;
  }
  return shuffle(ex.tiles, ex.id);
}

export function check(ex: Exercise, answer: Answer): Outcome {
  switch (ex.type) {
    case 'choice': {
      const ok = answer.type === 'choice' && answer.index === ex.answer;
      return { correct: ok, score: ok ? 100 : 0, expected: ex.options[ex.answer] };
    }
    case 'fill': {
      const given = answer.type === 'fill' ? plainText(answer.text) : '';
      const ok = given !== '' && ex.answers.some((a) => plainText(a) === given);
      return { correct: ok, score: ok ? 100 : 0, expected: ex.before + ex.answers[0] + ex.after };
    }
    case 'order': {
      const built = answer.type === 'order' ? answer.tiles.join('') : '';
      const ok = ex.answers.some((a) => plainText(a) === plainText(built));
      const out: Outcome = { correct: ok, score: ok ? 100 : 0, expected: ex.answers[0] };
      if (!ok && built) {
        const issues = checkZhSentence(built).issues;
        if (issues.length > 0) out.issues = issues;
      }
      return out;
    }
    case 'translate':
    case 'question': {
      const text = answer.type === 'text' ? answer.text : '';
      const q = ex.type === 'translate' ? translateQuestion(ex) : exerciseQuestion(ex);
      const result = grade(q, text);
      return { correct: result.score >= PASS_SCORE, score: result.score, result };
    }
    case 'match': {
      const mistakes = answer.type === 'match' ? answer.mistakes : ex.pairs.length;
      const score = Math.round((100 * ex.pairs.length) / (ex.pairs.length + mistakes));
      return { correct: mistakes === 0, score };
    }
  }
}

/** A generated vocabulary drill (not stored in the course data). */
export type Drill = Extract<Exercise, { type: 'choice' }> & { listen?: string };

/**
 * Four kinds of drills per lesson, drawn from its words with a fixed seed:
 * meaning of a word, word for a meaning, pinyin of a word, listening.
 */
export function vocabularyDrills(
  lessonId: string,
  words: readonly WordContent[],
  official: ReadonlyMap<number, OfficialWord>,
  opts: { count: number; listening: boolean },
): Drill[] {
  const usable = words.filter((w) => official.has(w.no));
  if (usable.length < 4) return [];
  const picked = shuffle(usable, `${lessonId}#words`).slice(0, opts.count);
  const drills = picked.map((w, i): Drill | null => {
    const o = official.get(w.no)!;
    // Distractors must not share the meaning, the characters or the pinyin of the word.
    const others = shuffle(
      usable.filter(
        (x) => x.no !== w.no && x.word !== w.word && x.meaningsVi[0] !== w.meaningsVi[0] && official.get(x.no)!.pinyin !== o.pinyin,
      ),
      `${lessonId}#${w.no}#others`,
    ).slice(0, 3);
    if (others.length < 3) return null;
    const kinds = opts.listening ? 4 : 3;
    const kind = i % kinds;
    const id = `${lessonId}-v${String(i + 1).padStart(2, '0')}`;
    const make = (promptVi: string, right: string, wrong: string[], zh?: string, listen?: string): Drill => {
      const options = shuffle([right, ...wrong], `${id}#options`);
      return { id, type: 'choice', promptVi, options, answer: options.indexOf(right), ...(zh ? { zh } : {}), ...(listen ? { listen } : {}) };
    };
    if (kind === 0) return make(`「${w.word}」 nghĩa là gì?`, w.meaningsVi[0]!, others.map((x) => x.meaningsVi[0]!), w.word);
    if (kind === 1) return make(`Từ nào có nghĩa là "${w.meaningsVi[0]}"?`, w.word, others.map((x) => x.word));
    if (kind === 2) return make(`Pinyin của 「${w.word}」 là gì?`, o.pinyin, others.map((x) => official.get(x.no)!.pinyin), w.word);
    return make('Nghe và chọn từ đúng.', w.word, others.map((x) => x.word), undefined, w.word);
  });
  return drills.filter((d): d is Drill => d !== null);
}
