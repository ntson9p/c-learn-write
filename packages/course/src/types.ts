/**
 * Course content types. Lessons are JSON files in data/lessons/hsk<N>/; every
 * item a teacher reviews carries a `review` record.
 */
import type { CountQuestion, LocationQuestion, ModelAnswerSpec, ModelQuestion, QuestionExample } from '@c-learn-write/grader';

export type ReviewStatus = 'draft' | 'approved' | 'changes_requested';

export interface Review {
  status: ReviewStatus;
  /** Reviewer name or initials. */
  by?: string;
  /** YYYY-MM-DD. */
  date?: string;
  /** Teacher's comment. */
  note?: string;
  /**
   * Content hash at approval time (contentHash). When the item changes
   * afterwards, the approval no longer counts.
   */
  hash?: string;
}

/** A Chinese sentence with pinyin and a Vietnamese translation. */
export interface Sentence {
  zh: string;
  /** One syllable per Han character, separated by spaces; filled by `npm run content:fill`. */
  py?: string;
  vi: string;
}

/** Course content for one word of the syllabus (data/hsk/vocabulary.json). */
export interface WordContent {
  /** Official number in the syllabus (1-1000). */
  no: number;
  /** Must equal the official word (checked). */
  word: string;
  /** Short Vietnamese meanings, most useful first. */
  meaningsVi: string[];
  /** Usage note: collocations, Vietnamese interference, a misleading Hán Việt reading… */
  noteVi?: string;
  examples: Sentence[];
  review: Review;
}

export interface GrammarMistake {
  wrong: string;
  right: string;
  noteVi: string;
  /** Grader issue code that catches this mistake, when there is one. */
  issue?: string;
}

/** Course content for one grammar point of the syllabus (data/hsk/grammar.json). */
export interface GrammarContent {
  /** Official number (1-244 for levels 1-3). */
  no: number;
  titleVi: string;
  /** One-sentence summary shown in lists. */
  summaryVi: string;
  /** Paragraphs; `**bold**` and 「Chinese」 are rendered. */
  explanationVi: string[];
  /** Sentence patterns, e.g. "Chủ ngữ + 想 + động từ". */
  patterns?: string[];
  examples: Sentence[];
  mistakes?: GrammarMistake[];
  /** Bound morphemes this point teaches (们, 第, 小…): allowed in later sentences. */
  morphemes?: string[];
  review: Review;
}

interface ExerciseBase {
  /** Unique across the course, e.g. "hsk1-01-e03". */
  id: string;
  /** Grammar points practised (official numbers). */
  grammar?: number[];
  review?: Review;
}

/** Pick one option. `zh` may contain ＿ for a blank. */
export interface ChoiceExercise extends ExerciseBase {
  type: 'choice';
  promptVi: string;
  zh?: string;
  options: string[];
  /** Index of the right option. */
  answer: number;
  explainVi?: string;
}

/** Type (or pick) the missing word: before + answer + after. */
export interface FillExercise extends ExerciseBase {
  type: 'fill';
  promptVi?: string;
  before: string;
  after: string;
  answers: string[];
  /** When given, the learner picks among them instead of typing. */
  options?: string[];
  vi?: string;
  explainVi?: string;
}

/** Put word tiles in order. */
export interface OrderExercise extends ExerciseBase {
  type: 'order';
  vi: string;
  tiles: string[];
  /** Accepted sentences (tiles joined, no punctuation). */
  answers: string[];
  explainVi?: string;
}

/** Translate a Vietnamese sentence; graded by the "model" grader. */
export interface TranslateExercise extends ExerciseBase {
  type: 'translate';
  vi: string;
  answers: (string | ModelAnswerSpec)[];
  /** Regression examples, as in grader questions. */
  examples?: QuestionExample[];
}

/** A free-answer question graded by the grader (count, location, model). */
export interface QuestionExercise extends ExerciseBase {
  type: 'question';
  question: Omit<CountQuestion, 'id' | 'lang'> | Omit<LocationQuestion, 'id' | 'lang'> | Omit<ModelQuestion, 'id' | 'lang'>;
}

/** Match the left items with the right items. */
export interface MatchExercise extends ExerciseBase {
  type: 'match';
  promptVi: string;
  pairs: [string, string][];
}

export type Exercise = ChoiceExercise | FillExercise | OrderExercise | TranslateExercise | QuestionExercise | MatchExercise;
export type ExerciseType = Exercise['type'];

/** One lesson of data/curriculum.json: what it teaches. */
export interface CurriculumLesson {
  /** "hsk1-01". */
  id: string;
  level: 1 | 2 | 3;
  order: number;
  titleVi: string;
  /** Topic of the syllabus (话题大纲), in Vietnamese. */
  topicVi: string;
  /** Official word numbers (data/hsk/vocabulary.json). */
  words: number[];
  /** Official grammar numbers (data/hsk/grammar.json). */
  grammar: number[];
}

/** data/lessons/hsk<N>/<NN>.json: the content of one lesson. */
export interface LessonContent {
  id: string;
  /** What the learner can do after the lesson. */
  goalsVi: string[];
  words: WordContent[];
  grammar: GrammarContent[];
  exercises: Exercise[];
}

/** A curriculum lesson with its content, when written. */
export interface Lesson {
  meta: CurriculumLesson;
  content: LessonContent | null;
}

/** data/hsk/vocabulary.json */
export interface OfficialWord {
  no: number;
  level: number;
  alsoLevels?: number[];
  word: string;
  sense?: number;
  pinyin: string;
  syllables: string[];
  pos: string[];
  posLater?: string[];
  hanViet: string;
  hanVietAmbiguous?: boolean;
}

/** data/hsk/grammar.json */
export interface OfficialGrammar {
  no: number;
  level: number;
  category: string;
  categoryName: string;
  item: string;
  content: string;
}

/** data/names.json: proper nouns allowed in sentences, with their reading. */
export interface NameEntry {
  zh: string;
  vi: string;
  py: string;
}

/** data/levels.json: which levels are complete (coverage is enforced). */
export type LevelStatus = 'complete' | 'in_progress' | 'planned';
