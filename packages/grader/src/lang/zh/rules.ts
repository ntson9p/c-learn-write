/**
 * Grammar rules for typical learner mistakes in Chinese.
 *
 * Every rule favours precision over recall: when the analysis is not sure
 * (an unknown noun, a word with several uses), the rule stays silent. A
 * missed mistake costs little; flagging a correct sentence teaches the
 * learner something wrong.
 */
import type { Fix, Issue } from '../../core/types';
import { sortIssues } from '../../core/scoring';
import type { QuantityPhrase, ZhDoc } from './analyze';
import { zhIssue, type ZhIssueCode } from './issues';
import { COMPOUNDS, NOUNS } from './lexicon';
import { locationRules } from './location-rules';
import { vi } from './messages';
import { toZhNumeral } from './numbers';
import { pinyinOf } from './pinyin';

export interface ZhRuleContext {
  penalties: Readonly<Record<string, number>>;
  /** Noun of a count question, used for answers that leave it out (有四个). */
  targetNoun?: string;
  /** Count questions also expect a measure word after a bare number (有四。). */
  countQuestion: boolean;
  allowArabicDigits: boolean;
  /** Places of a location question; their localizer is suggested when missing. */
  expectedPlaces?: readonly string[];
  /** Localizer group of a location question (里 for 书在书包里). */
  expectedLocalizer?: string;
}

function makeIssue(
  ctx: ZhRuleContext,
  code: ZhIssueCode,
  start: number,
  end: number,
  message: string,
  fix?: Fix,
): Issue {
  return zhIssue(ctx.penalties, code, start, end, message, fix);
}

/** The noun of a phrase when the analysis recognised it. */
function knownNoun(p: QuantityPhrase): string | undefined {
  return p.noun && p.noun.match !== 'unknown' ? p.noun.noun : undefined;
}

/** 四苹果 -> 四个苹果 ; 有四。-> 有四个。(count questions only) */
function missingMeasureWord(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  const out: Issue[] = [];
  for (const p of doc.phrases) {
    if (p.measure || p.number.parsed.digitString) continue;
    const noun = knownNoun(p);
    const insertAt = p.number.after;
    if (noun && p.noun) {
      const info = NOUNS.get(noun);
      if (info?.bare === 'ok') continue;
      const measure = info?.measures[0] ?? '个';
      const rest = doc.text.slice(insertAt, p.noun.end);
      const num = doc.text.slice(p.number.start, insertAt);
      out.push(
        makeIssue(ctx, 'missing_measure_word', p.number.start, p.noun.end, vi.missingMeasure(num, measure, rest, info?.bare === 'formal'), {
          start: insertAt,
          end: insertAt,
          replacement: measure,
        }),
      );
    } else if (!p.noun && p.modifiers.length === 0 && ctx.countQuestion && ctx.targetNoun) {
      const measure = NOUNS.get(ctx.targetNoun)?.measures[0] ?? '个';
      const num = doc.text.slice(p.number.start, insertAt);
      out.push(
        makeIssue(ctx, 'missing_measure_word', p.number.start, insertAt, vi.missingMeasureBare(num, measure), {
          start: insertAt,
          end: insertAt,
          replacement: measure,
        }),
      );
    }
  }
  return out;
}

/** 四本苹果 -> 四个苹果 (only individual measure words are checked). */
function wrongMeasureWord(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  const out: Issue[] = [];
  for (const p of doc.phrases) {
    if (!p.measure || p.measure.info.kind !== 'individual') continue;
    let noun = knownNoun(p);
    if (!noun && !p.noun && ctx.countQuestion) noun = ctx.targetNoun;
    if (!noun) continue;
    const info = NOUNS.get(noun);
    if (!info || info.measures.includes(p.measure.text)) continue;
    // 一家人 (a family): 家 + 人 is the word 家人, not a wrong measure word for 人.
    if (p.noun && COMPOUNDS.has(p.measure.text + p.noun.text)) continue;
    const right = info.measures[0]!;
    out.push(
      makeIssue(ctx, 'wrong_measure_word', p.measure.start, p.measure.end, vi.wrongMeasure(noun, right, p.measure.text), {
        start: p.measure.start,
        end: p.measure.end,
        replacement: right,
      }),
    );
  }
  return out;
}

/** 二个 -> 两个 (二 stays correct in 二月, 二号, 二楼, 二年级, 二斤...). */
function erLiang(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  const out: Issue[] = [];
  for (const p of doc.phrases) {
    if (p.number.text !== '二') continue;
    if (p.measure) {
      const { kind, erOk } = p.measure.info;
      if (erOk || kind === 'calendar' || kind === 'ordinal') continue;
    } else if (!knownNoun(p) && !(ctx.countQuestion && !p.noun)) {
      continue;
    }
    out.push(
      makeIssue(ctx, 'er_liang', p.number.start, p.number.end, vi.erLiang(p.measure?.text ?? ''), {
        start: p.number.start,
        end: p.number.end,
        replacement: '两',
      }),
    );
  }
  return out;
}

/** 十两 -> 十二, 两十 -> 二十, 第两 -> 第二. */
function liangMisuse(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  const out: Issue[] = [];
  for (const p of doc.phrases) {
    for (const offset of p.number.parsed.liangMisuse) {
      const i = p.number.start + offset;
      const right = p.number.text.slice(0, offset) + '二' + p.number.text.slice(offset + 1);
      out.push(
        makeIssue(ctx, 'liang_misuse', i, i + 1, vi.liangMisuse(p.number.text, right), { start: i, end: i + 1, replacement: '二' }),
      );
    }
  }
  for (const m of doc.text.matchAll(/第两/g)) {
    const i = (m.index ?? 0) + 1;
    out.push(makeIssue(ctx, 'liang_misuse', i, i + 1, vi.diLiang, { start: i, end: i + 1, replacement: '二' }));
  }
  return out;
}

/** 四个苹果绿 -> 四个绿苹果 (Vietnamese puts adjectives after the noun). */
function modifierOrder(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  const out: Issue[] = [];
  for (const p of doc.phrases) {
    const modifier = p.trailing[0];
    if (!p.noun || !modifier) continue;
    // With a homophone typo in the noun, the fix writes the intended noun.
    const noun = p.noun.match === 'homophone' ? p.noun.noun : p.noun.text;
    out.push(
      makeIssue(ctx, 'modifier_order', p.noun.start, modifier.end, vi.modifierOrder(modifier.text, noun), {
        start: p.noun.start,
        end: modifier.end,
        replacement: modifier.text + noun,
      }),
    );
  }
  return out;
}

/** 不有 -> 没有 (not in 无所不有, 不有趣, 不有名). */
function buYou(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  const out: Issue[] = [];
  for (const m of doc.text.matchAll(/不有/g)) {
    const i = m.index ?? 0;
    if (doc.text.slice(Math.max(0, i - 2), i) === '无所') continue;
    const next = doc.text[i + 2];
    if (next === '趣' || next === '名') continue;
    out.push(makeIssue(ctx, 'bu_you', i, i + 2, vi.buYou, { start: i, end: i + 1, replacement: '没' }));
  }
  return out;
}

/** 绿平果 -> 绿苹果, 率苹果 -> 绿苹果: homophones typed instead of the expected words. */
function homophoneChars(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  const out: Issue[] = [];
  for (const p of doc.phrases) {
    const typos = [...(p.noun?.match === 'homophone' ? p.noun.typos : []), ...p.modifiers.flatMap((m) => m.typos ?? [])];
    for (const t of typos) {
      out.push(
        makeIssue(ctx, 'homophone_char', t.index, t.index + 1, vi.homophone(t.written, t.expected, pinyinOf(t.written), pinyinOf(t.expected)), {
          start: t.index,
          end: t.index + 1,
          replacement: t.expected,
        }),
      );
    }
  }
  return out;
}

/** 4个 -> 四个, only when the question asks for characters. */
function arabicDigits(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  if (ctx.allowArabicDigits) return [];
  const out: Issue[] = [];
  for (const p of doc.phrases) {
    if (!/^[0-9]+$/.test(p.number.text)) continue;
    const info = p.measure?.info;
    const liang = !info || !(info.erOk || info.kind === 'calendar' || info.kind === 'ordinal');
    const zh = toZhNumeral(p.number.parsed.value, { beforeMeasure: liang });
    out.push(
      makeIssue(ctx, 'arabic_digits', p.number.start, p.number.end, vi.arabicDigits(p.number.text, zh), {
        start: p.number.start,
        end: p.number.end,
        replacement: zh,
      }),
    );
  }
  return out;
}

const RULES = [
  missingMeasureWord,
  wrongMeasureWord,
  erLiang,
  liangMisuse,
  modifierOrder,
  buYou,
  homophoneChars,
  arabicDigits,
  locationRules,
];

export function runZhRules(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  return sortIssues(RULES.flatMap((rule) => rule(doc, ctx)));
}
