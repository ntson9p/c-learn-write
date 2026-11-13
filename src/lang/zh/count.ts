/**
 * Grader for "how many X are there?" questions.
 *
 * 1. Find the quantity phrases that talk about the asked noun (and colour).
 * 2. Decide what number the learner claims (or why there is none).
 * 3. Compare it with the expected number: this gates the score.
 * 4. Remove points for each language issue found by the rules.
 */
import { applyFixes } from '../../core/fixes';
import { clampScore, resolvePenalties, sortIssues, totalPenalty } from '../../core/scoring';
import type { ContentStatus, CountQuestion, GradeResult, Issue } from '../../core/types';
import { analyzeZh, type QuantityPhrase, type ZhDoc } from './analyze';
import { hasHan } from './chars';
import { ZH_DEFAULT_PENALTIES, ZH_SEVERITY } from './issues';
import { COLORS, NOUNS, SHADES, matchLongest } from './lexicon';
import { vi } from './messages';
import { normalizeZh } from './normalize';
import { toZhNumeral } from './numbers';
import { runZhRules } from './rules';

/** How a quantity phrase relates to the question. */
export type PhraseRef = 'target' | 'other_color' | 'other_noun' | 'not_count';

const DEFAULT_WRONG_CONTENT_SCORE = 20;

/** 四个是绿的 / 四个都是绿色的: a colour stated after the phrase. */
function predicateColor(doc: ZhDoc, p: QuantityPhrase): string | undefined {
  const clause = doc.clauses[p.clause];
  if (!clause) return undefined;
  const rest = doc.text.slice(p.end, clause.end);
  const lead = /^(?:都|也|全都|全)?是/u.exec(rest);
  if (!lead) return undefined;
  let pos = lead[0].length;
  const shade = matchLongest(rest, pos, SHADES);
  if (shade) pos += shade.length;
  return matchLongest(rest, pos, COLORS);
}

/** Colours said about a phrase, inside it (绿苹果) or after it (是绿的). */
function phraseColors(doc: ZhDoc, p: QuantityPhrase): string[] {
  const colors = [...p.modifiers, ...p.trailing].filter((m) => m.kind === 'color').map((m) => m.base);
  const predicate = predicateColor(doc, p);
  return predicate ? [...colors, predicate] : colors;
}

export function classifyPhrase(doc: ZhDoc, p: QuantityPhrase, q: CountQuestion): PhraseRef {
  const kind = p.measure?.info.kind;
  if (p.measure && kind !== 'individual') {
    // 四杯咖啡 counts cups of coffee; 四种苹果, 四点, 四岁 are not counts of the noun.
    const allowed = NOUNS.get(q.expected.noun)?.measures ?? [];
    if (kind !== 'container' || !allowed.includes(p.measure.text)) return 'not_count';
  }
  const colors = phraseColors(doc, p);
  const accepted = q.expected.colors ?? [];
  const colorOk = accepted.length === 0 || colors.length === 0 || colors.some((c) => accepted.includes(c));
  if (!p.noun || (p.noun.match !== 'unknown' && p.noun.noun === q.expected.noun)) {
    return colorOk ? 'target' : 'other_color';
  }
  return 'other_noun';
}

/** 没有绿苹果: a clause without numbers that says there are none. */
function claimsZero(doc: ZhDoc, q: CountQuestion): boolean {
  const accepted = q.expected.colors ?? [];
  return doc.clauses.some((clause, index) => {
    if (doc.phrases.some((p) => p.clause === index)) return false;
    const negation = clause.text.indexOf('没');
    if (negation < 0) return false;
    const nounAt = clause.text.indexOf(q.expected.noun, negation);
    if (nounAt < 0) return false;
    const between = clause.text.slice(negation, nounAt);
    const colors = COLORS.filter((c) => between.includes(c));
    return accepted.length === 0 || colors.length === 0 || colors.some((c) => accepted.includes(c));
  });
}

function targetLabel(q: CountQuestion): string {
  return (q.expected.colors?.[0] ?? '') + q.expected.noun;
}

function describePhrase(p: QuantityPhrase, q: CountQuestion): string {
  const modifiers = [...p.modifiers, ...p.trailing].map((m) => m.base).join('');
  return modifiers + (p.noun?.text ?? q.expected.noun);
}

function defaultSentence(q: CountQuestion): string {
  const measure = NOUNS.get(q.expected.noun)?.measures[0] ?? '个';
  return `有${toZhNumeral(q.expected.number, { beforeMeasure: true })}${measure}${targetLabel(q)}。`;
}

interface Content {
  status: ContentStatus;
  message: string;
  claim?: number;
  needsReview: boolean;
}

function judgeContent(doc: ZhDoc, q: CountQuestion, refs: { p: QuantityPhrase; ref: PhraseRef }[]): Content {
  const targets = refs.filter((r) => r.ref === 'target').map((r) => r.p);
  let positives = targets.filter((p) => !p.negated);
  let claim: number | undefined;

  // 图片里有六个苹果，四个是绿的: when the numbers differ, trust the phrases
  // that explicitly state an accepted colour.
  const accepted = q.expected.colors ?? [];
  if (accepted.length > 0 && new Set(positives.map((p) => p.number.parsed.value)).size > 1) {
    const explicit = positives.filter((p) => phraseColors(doc, p).some((c) => accepted.includes(c)));
    if (explicit.length > 0) positives = explicit;
  }

  if (positives.length > 0) {
    if (positives.some((p) => p.number.approximate)) {
      return { status: 'wrong', message: vi.countApproximate, needsReview: false };
    }
    const values = [...new Set(positives.map((p) => p.number.parsed.value))];
    if (values.length > 1) return { status: 'wrong', message: vi.countAmbiguous(values), needsReview: false };
    claim = values[0];
  } else if (targets.length > 0) {
    return { status: 'wrong', message: vi.countNegated, needsReview: false };
  } else if (claimsZero(doc, q)) {
    claim = 0;
  } else {
    const other = refs.find((r) => r.ref === 'other_color' || r.ref === 'other_noun');
    if (!other) return { status: 'no_answer', message: vi.countNoNumber(targetLabel(q)), needsReview: false };
    const near = other.p.noun?.near;
    if (near && other.p.noun) {
      return { status: 'wrong', message: vi.countNear(other.p.noun.text, near), needsReview: true };
    }
    return { status: 'wrong', message: vi.countOther(describePhrase(other.p, q), targetLabel(q)), needsReview: false };
  }

  if (claim === undefined) return { status: 'no_answer', message: vi.countNoNumber(targetLabel(q)), needsReview: false };
  return claim === q.expected.number
    ? { status: 'correct', message: vi.countCorrect, claim, needsReview: false }
    : { status: 'wrong', message: vi.countWrong(claim), claim, needsReview: false };
}

export function gradeZhCount(q: CountQuestion, answer: string): GradeResult {
  const penalties = resolvePenalties(ZH_DEFAULT_PENALTIES, q.penalties);
  const { text, convertedTraditional } = normalizeZh(answer);
  const sentence = q.expected.sentence ?? defaultSentence(q);
  const issue = (code: 'traditional_converted' | 'not_full_sentence', message: string): Issue => ({
    code,
    severity: ZH_SEVERITY[code],
    penalty: penalties[code] ?? 0,
    message,
    start: 0,
    end: 0,
  });

  const issues: Issue[] = convertedTraditional ? [issue('traditional_converted', vi.traditional)] : [];
  if (!text || (!hasHan(text) && !/[0-9]/.test(text))) {
    return {
      score: 0,
      content: { status: 'no_answer', message: text ? vi.notChinese : vi.empty },
      issues,
      normalized: text,
      suggestion: sentence,
      needsReview: false,
    };
  }

  const doc = analyzeZh(text, { expectedNouns: [q.expected.noun], expectedColors: q.expected.colors ?? [] });
  issues.push(
    ...runZhRules(doc, {
      penalties,
      targetNoun: q.expected.noun,
      countQuestion: true,
      allowArabicDigits: q.options?.allowArabicDigits ?? true,
    }),
  );

  const refs = doc.phrases.map((p) => ({ p, ref: classifyPhrase(doc, p, q) }));
  const content = judgeContent(doc, q, refs);

  if (content.status === 'correct' && q.options?.requireFullSentence) {
    const target = refs.find((r) => r.ref === 'target' && !r.p.negated)?.p;
    if (target && !/[有是]/.test(target.prefix)) issues.push(issue('not_full_sentence', vi.notFullSentence(sentence)));
  }

  const sorted = sortIssues(issues);
  const penalty = totalPenalty(sorted);
  let score = 0;
  let message = content.message;
  if (content.status === 'correct') {
    score = clampScore(100 - penalty);
    if (penalty === 0) message = vi.perfect;
  } else if (content.status === 'wrong') {
    score = Math.min(q.options?.wrongContentScore ?? DEFAULT_WRONG_CONTENT_SCORE, clampScore(100 - penalty));
  }

  const result: GradeResult = {
    score,
    content: { status: content.status, message },
    issues: sorted,
    normalized: text,
    needsReview: content.needsReview,
    details: {
      expected: q.expected.number,
      claim: content.claim ?? null,
      phrases: refs.map(({ p, ref }) => ({
        text: text.slice(p.start, p.end),
        value: p.number.parsed.value,
        measure: p.measure?.text ?? null,
        noun: p.noun?.noun ?? null,
        nounMatch: p.noun?.match ?? null,
        negated: p.negated,
        approximate: p.number.approximate,
        ref,
      })),
    },
  };
  if (content.status === 'correct') {
    const corrected = applyFixes(text, sorted.flatMap((i) => (i.fix ? [i.fix] : []))).text;
    if (corrected !== text) result.corrected = corrected;
  } else {
    result.suggestion = sentence;
  }
  return result;
}
