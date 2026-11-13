/**
 * Language-independent types shared by every language pack.
 *
 * A question is plain JSON data written by a content author; the engine never
 * needs code changes to support a new question of an existing type.
 */

/** Languages the engine can grade. */
export type LangCode = 'zh';

/** Question types the engine can grade. */
export type QuestionType = 'count' | 'model';

export interface QuestionExample {
  /** A learner answer. */
  answer: string;
  /** The score the engine must give it (0-100). */
  score: number;
  /** Issue codes the result must contain (order does not matter). */
  issues?: string[];
  /** Why this example exists (shown in the demo). */
  note?: string;
}

export interface BaseQuestion {
  /** Stable identifier, e.g. "zh-count-green-apples". */
  id: string;
  lang: LangCode;
  type: QuestionType;
  /** Short title for lists (learner's language). */
  title?: string;
  /** The question shown to the learner, in the target language. */
  prompt: string;
  /** Translation of the prompt in the learner's language. */
  promptVi?: string;
  /** Optional picture, as text/emoji (used by the demo). */
  picture?: string;
  /** Per-question penalty overrides, by issue code. */
  penalties?: Record<string, number>;
  /** Example answers with their expected results (demo + regression tests). */
  examples?: QuestionExample[];
}

/** "How many X are there?" questions. */
export interface CountQuestion extends BaseQuestion {
  type: 'count';
  expected: {
    /** The correct count. */
    number: number;
    /** The counted noun, e.g. 苹果. */
    noun: string;
    /** Accepted colour words for the noun, e.g. ["绿", "青"]. */
    colors?: string[];
    /** A full model answer, e.g. 图片里有四个绿苹果。 */
    sentence?: string;
  };
  options?: {
    /** Penalise answers that are not a full sentence (default false). */
    requireFullSentence?: boolean;
    /** Accept Arabic digits such as 4 (default true). */
    allowArabicDigits?: boolean;
    /** Highest score for an answer with the wrong content (default 20). */
    wrongContentScore?: number;
  };
}

export interface ModelAnswerSpec {
  /** Answer text; supports [a|b] alternatives and (x) optional parts. */
  text: string;
  /** Score for this answer (default 100). */
  score?: number;
}

/** Closed questions graded against a list of accepted (model) answers. */
export interface ModelQuestion extends BaseQuestion {
  type: 'model';
  answers: (string | ModelAnswerSpec)[];
  options?: {
    /** Accept Arabic digits such as 2 (default true). */
    allowArabicDigits?: boolean;
    /** Maximum number of missing/extra function words still accepted. */
    maxLightEdits?: number;
  };
}

export type Question = CountQuestion | ModelQuestion;

export type Severity = 'error' | 'typo' | 'info';

/** A suggested replacement of text[start, end) (start === end inserts). */
export interface Fix {
  start: number;
  end: number;
  replacement: string;
}

export interface Issue {
  /** Machine-readable code, e.g. "missing_measure_word". */
  code: string;
  severity: Severity;
  /** Points removed from the score. */
  penalty: number;
  /** Explanation for the learner. */
  message: string;
  /** Span in the normalized answer; start === end marks an insertion point. */
  start: number;
  end: number;
  fix?: Fix;
}

/**
 * - correct: the answer says the right thing (it may still have language issues)
 * - wrong: the answer says something else (wrong number, negated, ...)
 * - no_answer: nothing gradable (empty, not Chinese, no number, ...)
 * - unmatched: a model-answer question where no accepted answer matched
 */
export type ContentStatus = 'correct' | 'wrong' | 'no_answer' | 'unmatched';

export interface GradeResult {
  /** 0-100. */
  score: number;
  content: {
    status: ContentStatus;
    message: string;
  };
  /** Language issues, sorted by position. */
  issues: Issue[];
  /** The normalized answer that issue spans refer to. */
  normalized: string;
  /** A corrected version of the answer, when the engine can build one. */
  corrected?: string;
  /** A reference answer to show the learner. */
  suggestion?: string;
  /** True when a teacher should double-check this result. */
  needsReview: boolean;
  /** Extra data for debugging and the demo. */
  details?: Record<string, unknown>;
}
