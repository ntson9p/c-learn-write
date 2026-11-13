import type { GradeResult, Question } from './core/types';
import { gradeZh } from './lang/zh';

/**
 * Grades a learner answer. Dispatches on the question language; a new
 * language only needs its own pack under src/lang/<code>.
 */
export function grade(question: Question, answer: string): GradeResult {
  switch (question.lang) {
    case 'zh':
      return gradeZh(question, answer);
    default:
      throw new Error(`Unsupported language: ${String((question as { lang?: unknown }).lang)}`);
  }
}
