/**
 * Rules for location phrases, aimed at typical Vietnamese-transfer errors:
 *
 *   place_order        我吃饭在家      -> 我在家吃饭    (在 + place goes before the verb)
 *                      我放书在桌子上  -> 我把书放在桌子上
 *   localizer_order    在上桌子        -> 在桌子上      (the localizer follows the noun)
 *   missing_localizer  在桌子          -> 在桌子上      (an object needs a localizer)
 *   extra_localizer    在中国里        -> 在中国        (no 里 after country/city names)
 *   homophone_char     再家            -> 在家, 书报里 -> 书包里
 *
 * Like the other rules they favour precision: place_order only fires when the
 * 在 phrase ends its clause, a known action verb comes before it, and the
 * verb right before 在 is not one that takes 在 after it (住在, 放在...).
 */
import { applyFixes } from '../../core/fixes';
import type { Fix, Issue } from '../../core/types';
import type { ZhDoc } from './analyze';
import { zhIssue } from './issues';
import { ACTION_VERBS, ADJECTIVES, COMPOUND_LIST, matchLongest, NOT_ACTIONS, NOUNS, PLACES, ZAI_LIST, ZAI_VERBS } from './lexicon';
import { vi } from './messages';
import { pinyinOf } from './pinyin';
import type { LocationMention, PlaceUnit } from './places';
import type { ZhRuleContext } from './rules';
import { fixTypos } from './spans';

const ONLY_PARTICLES = /^[了呢吧啊呀吗啦]*$/u;
/** 我去学习在图书馆 needs a different fix (我去图书馆学习); stay silent. */
const MOTION_VERBS = /[去来回到]/u;
/** A verb right after these is used as a noun (我的工作在河内). */
const NOUN_MARKERS = new Set(['的', '个', '份', '种', '项', '这', '那']);

/** Words used to step over non-verbs while looking for the first action verb. */
const SCAN_WORDS = new Map<string, boolean>();
// Syllabus compounds first, so that 运动 inside 运动员 is not taken for a verb;
// known action verbs below override them.
for (const word of COMPOUND_LIST) SCAN_WORDS.set(word, false);
for (const word of [...NOT_ACTIONS, ...NOUNS.keys(), ...PLACES.keys(), ...ADJECTIVES]) SCAN_WORDS.set(word, false);
for (const word of ACTION_VERBS) SCAN_WORDS.set(word, true);
const SCAN_LIST = [...SCAN_WORDS.keys()].sort((a, b) => b.length - a.length || a.localeCompare(b));

function firstActionVerb(text: string, from: number, to: number) {
  let i = from;
  while (i < to) {
    const word = matchLongest(text, i, SCAN_LIST, to);
    if (word && SCAN_WORDS.get(word) && !NOUN_MARKERS.has(text[i - 1] ?? '')) {
      return { start: i, end: i + word.length, word };
    }
    i += word ? word.length : 1;
  }
  return undefined;
}

/**
 * `afterZai`: the place is introduced by 在 (or a bare answer to 在哪儿).
 * After a verb such as 去 or 回, an object is not a location (去上海的飞机
 * "the plane to Shanghai", 拿回你的手机): no missing_localizer there.
 */
function unitIssues(text: string, unit: PlaceUnit, ctx: ZhRuleContext, afterZai: boolean): Issue[] {
  const issues: Issue[] = [];
  const { noun, localizer } = unit;
  for (const t of noun?.typos ?? []) {
    issues.push(
      zhIssue(ctx.penalties, 'homophone_char', t.index, t.index + 1, vi.homophone(t.written, t.expected, pinyinOf(t.written), pinyinOf(t.expected)), {
        start: t.index,
        end: t.index + 1,
        replacement: t.expected,
      }),
    );
  }
  if (!noun) return issues;
  const nounText = fixTypos(text, noun.start, noun.end, noun.typos);
  if (unit.reversed && localizer) {
    issues.push(
      zhIssue(ctx.penalties, 'localizer_order', localizer.start, noun.end, vi.localizerOrder(nounText, localizer.text), {
        start: localizer.start,
        end: noun.end,
        replacement: nounText + localizer.text,
      }),
    );
  } else if (noun.kind === 'object' && !localizer && afterZai) {
    const expected = ctx.expectedLocalizer && ctx.expectedPlaces?.includes(noun.word);
    const group = expected ? ctx.expectedLocalizer! : (PLACES.get(noun.word)?.localizer ?? '上');
    issues.push(
      zhIssue(ctx.penalties, 'missing_localizer', noun.start, noun.end, vi.missingLocalizer(nounText, group), {
        start: noun.end,
        end: noun.end,
        replacement: group,
      }),
    );
  } else if (noun.kind === 'proper' && localizer?.group === '里') {
    issues.push(
      zhIssue(ctx.penalties, 'extra_localizer', localizer.start, localizer.end, vi.extraLocalizer(nounText, localizer.text), {
        start: localizer.start,
        end: localizer.end,
        replacement: '',
      }),
    );
  }
  return issues;
}

/** A unit that surely names a place: a known place word, or anything with a localizer. */
const isKnownPlace = (u: PlaceUnit) => u.localizer !== undefined || (u.noun !== undefined && u.noun.kind !== 'unknown');

function placeOrder(doc: ZhDoc, m: LocationMention, inner: readonly Issue[], ctx: ZhRuleContext): Issue | undefined {
  const clause = doc.clauses[m.clause];
  if (m.zai < 0 || !clause) return undefined;
  if (!ONLY_PARTICLES.test(doc.text.slice(m.phrase.end, clause.end))) return undefined;
  if (!m.phrase.units.some(isKnownPlace)) return undefined;
  const before = doc.text.slice(clause.start, m.zai);
  if (MOTION_VERBS.test(before)) return undefined;
  if (ZAI_LIST.some((w) => before.endsWith(w))) return undefined; // 住在河内, 放在桌子上
  const verb = firstActionVerb(doc.text, clause.start, m.zai);
  if (!verb) return undefined;
  // 我买的本子在书包里: the verb is inside a 的-phrase that names the subject,
  // and 在 + place is the predicate. Stay silent whenever 的 follows the verb.
  if (doc.text.slice(verb.end, m.zai).includes('的')) return undefined;

  // The moved phrase carries the corrections found inside it (再 -> 在, 里家 -> 家里).
  const phraseStart = m.zai + 1;
  const innerFixes: Fix[] = inner.flatMap((i) =>
    i.fix && i.fix.start >= phraseStart && i.fix.end <= m.phrase.end
      ? [{ ...i.fix, start: i.fix.start - phraseStart, end: i.fix.end - phraseStart }]
      : [],
  );
  const place = '在' + applyFixes(doc.text.slice(phraseStart, m.phrase.end), innerFixes).text;
  const object = doc.text.slice(verb.end, m.zai);
  const original = doc.text.slice(verb.start, m.phrase.end);
  const withBa = ZAI_VERBS.has(verb.word) && object.length > 0;
  const replacement = withBa ? `把${object}${verb.word}${place}` : place + doc.text.slice(verb.start, m.zai);
  const message = withBa ? vi.placeOrderBa(replacement, original) : vi.placeOrder(replacement, original);
  return zhIssue(ctx.penalties, 'place_order', verb.start, m.phrase.end, message, {
    start: verb.start,
    end: m.phrase.end,
    replacement,
  });
}

export function locationRules(doc: ZhDoc, ctx: ZhRuleContext): Issue[] {
  const out: Issue[] = [];
  for (const m of doc.locations) {
    const inner: Issue[] = [];
    if (m.zaiTypo) {
      inner.push(
        zhIssue(ctx.penalties, 'homophone_char', m.zai, m.zai + 1, vi.homophone('再', '在', pinyinOf('再'), pinyinOf('在')), {
          start: m.zai,
          end: m.zai + 1,
          replacement: '在',
        }),
      );
    }
    for (const unit of m.phrase.units) inner.push(...unitIssues(doc.text, unit, ctx, m.verb === undefined));
    out.push(...inner);
    const order = placeOrder(doc, m, inner, ctx);
    if (order) out.push(order);
  }
  return out;
}
