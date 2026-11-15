export type * from './core/types';
export { expandPattern, PatternError } from './core/patterns';
export { validateQuestion } from './core/validate';
export { grade } from './grade';
export { checkZhSentence, ZH_DEFAULT_PENALTIES, ZH_ISSUE_LABELS_VI, type SentenceCheck, type ZhIssueCode } from './lang/zh';
export { segments, type Segment } from './highlight';
export { normalizeZh } from './lang/zh/normalize';
