import type { GradeResult, Question } from '../../core/types';
import { gradeZhCount } from './count';
import { gradeZhModel } from './model';

export { ZH_DEFAULT_PENALTIES, ZH_ISSUE_LABELS_VI, type ZhIssueCode } from './issues';
export { gradeZhCount } from './count';
export { gradeZhModel } from './model';

/** Grades an answer to a Chinese question. */
export function gradeZh(question: Question, answer: string): GradeResult {
  switch (question.type) {
    case 'count':
      return gradeZhCount(question, answer);
    case 'model':
      return gradeZhModel(question, answer);
  }
}
