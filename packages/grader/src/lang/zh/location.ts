/**
 * Grader for "where...?" questions (在哪儿).
 *
 * - Picture questions (书在哪儿？ with one right place) compare the place and
 *   its localizer with the expected ones: 书包上 is not 书包里.
 * - Personal questions (你在哪儿吃饭？) accept any place; only the language is
 *   graded. A place name the lexicon does not know is accepted but flagged
 *   for review.
 * Language issues (place order, localizers, typos...) remove points as usual.
 */
import { applyFixes } from '../../core/fixes';
import { clampScore, resolvePenalties, sortIssues, totalPenalty } from '../../core/scoring';
import type { ContentStatus, GradeResult, Issue, LocationQuestion } from '../../core/types';
import { analyzeZh, type ZhDoc } from './analyze';
import { hasHan } from './chars';
import { ZH_DEFAULT_PENALTIES, zhIssue } from './issues';
import { LOCALIZERS } from './lexicon';
import { vi } from './messages';
import { normalizeZh } from './normalize';
import type { LocationMention } from './places';
import { runZhRules } from './rules';

/** How a mentioned place relates to the question. */
export type MentionRef = 'target' | 'wrong_localizer' | 'other' | 'unknown';

const DEFAULT_WRONG_CONTENT_SCORE = 20;

export function classifyMention(m: LocationMention, places: readonly string[], group: string | undefined): MentionRef {
  if (places.length === 0) {
    return m.phrase.units.some((u) => u.localizer || (u.noun && u.noun.kind !== 'unknown')) ? 'target' : 'unknown';
  }
  for (const unit of m.phrase.units) {
    const noun = unit.noun;
    if (!noun || !(noun.words.some((w) => places.includes(w)) || places.includes(noun.word))) continue;
    // A missing localizer (书在书包) is a language issue, not a different place.
    if (!group || !unit.localizer || unit.localizer.group === group) return 'target';
    return 'wrong_localizer';
  }
  // A localizer word that is itself the expected place (外面).
  if (m.phrase.units.some((u) => !u.noun && u.localizer && places.includes(u.localizer.text))) return 'target';
  return 'other';
}

interface Content {
  status: ContentStatus;
  message: string;
  needsReview: boolean;
}

function judge(doc: ZhDoc, places: readonly string[], group: string | undefined): Content {
  const refs = doc.locations.map((m) => ({ m, ref: classifyMention(m, places, group) }));
  const positives = refs.filter((r) => !r.m.negated);
  const targets = positives.filter((r) => r.ref === 'target');
  const others = positives.filter((r) => r.ref !== 'target');
  const said = (m: LocationMention) => m.phrase.text;

  if (targets.length > 0) {
    // Other places may describe other things (书在书包里，书包在桌子上): accept, but let a teacher check.
    return { status: 'correct', message: vi.locationCorrect, needsReview: places.length > 0 && others.length > 0 };
  }
  const first = others[0];
  if (first && places.length === 0) {
    return { status: 'correct', message: vi.locationUnknown(said(first.m)), needsReview: true };
  }
  if (first) {
    const near = first.m.phrase.units.find((u) => u.noun?.near)?.noun;
    if (near?.near) return { status: 'wrong', message: vi.countNear(near.text, near.near), needsReview: true };
    return { status: 'wrong', message: vi.locationWrong(said(first.m)), needsReview: false };
  }
  if (refs.length > 0) return { status: 'wrong', message: vi.locationNegated, needsReview: false };
  return { status: 'no_answer', message: vi.locationNone, needsReview: false };
}

export function gradeZhLocation(q: LocationQuestion, answer: string): GradeResult {
  const penalties = resolvePenalties(ZH_DEFAULT_PENALTIES, q.penalties);
  const { text, convertedTraditional } = normalizeZh(answer);
  const places = q.expected.places ?? [];
  const group = q.expected.localizer ? LOCALIZERS.get(q.expected.localizer) : undefined;
  const sentence = q.expected.sentence;
  const issues: Issue[] = convertedTraditional ? [zhIssue(penalties, 'traditional_converted', 0, 0, vi.traditional)] : [];

  if (!text || (!hasHan(text) && !/[0-9]/.test(text))) {
    return {
      score: 0,
      content: { status: 'no_answer', message: text ? vi.notChinese : vi.empty },
      issues,
      normalized: text,
      ...(sentence ? { suggestion: sentence } : {}),
      needsReview: false,
    };
  }

  const doc = analyzeZh(text, { expectedPlaces: places, locationQuestion: true });
  issues.push(
    ...runZhRules(doc, {
      penalties,
      countQuestion: false,
      allowArabicDigits: true,
      expectedPlaces: places,
      expectedLocalizer: group,
    }),
  );
  const content = judge(doc, places, group);

  const sorted = sortIssues(issues);
  const penalty = totalPenalty(sorted);
  let score = 0;
  let message = content.message;
  if (content.status === 'correct') {
    score = clampScore(100 - penalty);
    if (penalty === 0 && !content.needsReview) message = vi.perfect;
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
      places,
      localizer: group ?? null,
      mentions: doc.locations.map((m) => ({
        text: m.phrase.text,
        via: m.zai >= 0 ? text[m.zai] : (m.verb ?? null),
        negated: m.negated,
        ref: classifyMention(m, places, group),
        units: m.phrase.units.map((u) => ({
          place: u.noun?.word ?? null,
          kind: u.noun?.kind ?? null,
          localizer: u.localizer?.text ?? null,
          reversed: u.reversed,
        })),
      })),
    },
  };
  if (content.status === 'correct') {
    const corrected = applyFixes(text, sorted.flatMap((i) => (i.fix ? [i.fix] : []))).text;
    if (corrected !== text) result.corrected = corrected;
  } else if (sentence) {
    result.suggestion = sentence;
  }
  return result;
}
