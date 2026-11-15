/**
 * Runs the language rules on one sentence, outside of any question: used for
 * word-order exercises (to explain a wrong order) and to check that correct
 * course sentences raise no issue at all.
 */
import { resolvePenalties } from '../../core/scoring';
import type { Issue } from '../../core/types';
import { analyzeZh } from './analyze';
import { ZH_DEFAULT_PENALTIES } from './issues';
import { normalizeZh } from './normalize';
import { runZhRules } from './rules';

export interface SentenceCheck {
  /** The normalized sentence; issue spans refer to it. */
  normalized: string;
  issues: Issue[];
}

export function checkZhSentence(text: string): SentenceCheck {
  const { text: normalized } = normalizeZh(text);
  const issues = runZhRules(analyzeZh(normalized), {
    penalties: resolvePenalties(ZH_DEFAULT_PENALTIES, undefined),
    countQuestion: false,
    allowArabicDigits: true,
  });
  return { normalized, issues };
}
