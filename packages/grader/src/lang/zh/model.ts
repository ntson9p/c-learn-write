/**
 * Grader for closed questions with a list of accepted (model) answers.
 *
 * 1. An answer identical to a model answer (ignoring punctuation, leading
 *    interjections and trailing particles) gets that answer's score.
 * 2. Otherwise the grammar rules run; their fixes are applied and the result
 *    is compared again.
 * 3. The comparison is a character alignment that tolerates homophone typos
 *    and a few missing/extra function words, never changes of meaning
 *    (不, 没, numbers...).
 * 4. When the whole answer does not match, each clause is tried: an answer
 *    with extra information (我是越南人，我住在河内) is accepted, but marked for
 *    review because the extra part was not checked.
 */
import { align, type AlignCosts } from '../../core/align';
import { applyFixes } from '../../core/fixes';
import { expandPattern } from '../../core/patterns';
import { clampScore, resolvePenalties, sortIssues, totalPenalty } from '../../core/scoring';
import type { Fix, GradeResult, Issue, ModelQuestion } from '../../core/types';
import { analyzeZh, findNumberSpans, splitClauses } from './analyze';
import { hasHan, isHan, isIgnorable, isLatin } from './chars';
import { ZH_DEFAULT_PENALTIES, ZH_SEVERITY } from './issues';
import { vi } from './messages';
import { normalizeZh } from './normalize';
import { parseZhNumber } from './numbers';
import { isHomophone, pinyinOf } from './pinyin';
import { runZhRules } from './rules';

export interface Unit {
  /** Compared for equality: the character, or "#4" for any spelling of 4. */
  key: string;
  /** As written. */
  surface: string;
  kind: 'han' | 'number' | 'latin' | 'other';
  start: number;
  end: number;
}

const LEADING_INTERJECTIONS = new Set(['嗯', '哦', '噢', '呃', '啊', '喔']);
const TRAILING_PARTICLES = new Set(['啊', '呀', '哦', '啦', '嘛', '喔']);
/**
 * Function words that may be missing or extra, at a cost. Demonstratives
 * (这/那) are not here: swapping them changes the meaning.
 */
const LIGHT_WORDS = new Set(['是', '的', '了', '很', '也', '都', '就', '还', '个', '呢', '吧', '啊', '呀']);
/** Characters that change the meaning; an edit on them is never tolerated. */
const CRITICAL = new Set(['不', '没', '别', '无', '非', '未', '吗', '否']);
/** Same pinyin but opposite or very different meanings: never a typing slip (买 mua / 卖 bán). */
const MEANINGFUL_HOMOPHONES: readonly (readonly [string, string])[] = [['买', '卖']];

/** Splits a normalized text into comparable units (characters and numbers). */
export function unitize(text: string): Unit[] {
  const numbers = new Map<number, { end: number; key: string }>();
  for (const span of findNumberSpans(text)) {
    const parsed = parseZhNumber(span.text);
    const value = parsed ? (parsed.range ? parsed.range.join('-') : String(parsed.value)) : span.text;
    numbers.set(span.start, { end: span.end, key: `#${value}` });
  }
  const units: Unit[] = [];
  let i = 0;
  while (i < text.length) {
    const number = numbers.get(i);
    if (number) {
      units.push({ key: number.key, surface: text.slice(i, number.end), kind: 'number', start: i, end: number.end });
      i = number.end;
      continue;
    }
    const ch = text[i]!;
    if (isIgnorable(ch)) {
      i++;
    } else if (isLatin(ch)) {
      let j = i;
      while (j < text.length && isLatin(text[j])) j++;
      units.push({ key: text.slice(i, j).toLowerCase(), surface: text.slice(i, j), kind: 'latin', start: i, end: j });
      i = j;
    } else {
      units.push({ key: ch, surface: ch, kind: isHan(ch) ? 'han' : 'other', start: i, end: i + 1 });
      i++;
    }
  }
  while (units.length > 1 && LEADING_INTERJECTIONS.has(units[0]!.surface) && isIgnorable(text[units[0]!.end])) units.shift();
  while (units.length > 1 && TRAILING_PARTICLES.has(units[units.length - 1]!.surface)) units.pop();
  return units;
}

const surfaceKey = (units: readonly Unit[]) => units.map((u) => u.surface).join('');
const isLight = (u: Unit) => u.kind === 'han' && LIGHT_WORDS.has(u.surface);
const isCritical = (u: Unit) => u.kind === 'number' || CRITICAL.has(u.surface);

function isHomophonePair(a: Unit, b: Unit): boolean {
  if (a.surface.length !== 1 || b.surface.length !== 1) return false;
  if (a.kind === 'number' && b.kind === 'number') return false; // 四 vs 十 are different answers
  if (CRITICAL.has(a.surface) || CRITICAL.has(b.surface)) return false;
  if (MEANINGFUL_HOMOPHONES.some(([x, y]) => (a.surface === x && b.surface === y) || (a.surface === y && b.surface === x))) return false;
  return isHomophone(a.surface, b.surface);
}

const COSTS: AlignCosts<Unit, Unit> = {
  equal: (a, b) => a.key === b.key,
  substitute: (a, b) => (isHomophonePair(a, b) ? 0.3 : 1),
  extra: (a) => (isLight(a) ? 0.9 : 1),
  missing: (b) => (isLight(b) ? 0.9 : 1),
};

interface ModelEntry {
  /** The answer as the author wrote it (after pattern expansion). */
  display: string;
  units: Unit[];
  key: string;
  score: number;
}

type Edit =
  | { type: 'homophone'; unit: Unit; expected: Unit }
  | { type: 'extra'; unit: Unit }
  | { type: 'missing'; unit: Unit; at: number };

interface Candidate {
  model: ModelEntry;
  cost: number;
  acceptable: boolean;
  /** One meaning-preserving edit away from acceptable: worth a teacher's look. */
  close: boolean;
  edits: Edit[];
}

type Penalties = Readonly<Record<string, number>>;

const modelCache = new WeakMap<ModelQuestion, ModelEntry[]>();

function modelsOf(q: ModelQuestion): ModelEntry[] {
  const cached = modelCache.get(q);
  if (cached) return cached;
  const byKey = new Map<string, ModelEntry>();
  for (const answer of q.answers) {
    const spec = typeof answer === 'string' ? { text: answer } : answer;
    const score = spec.score ?? 100;
    for (const display of expandPattern(spec.text)) {
      const units = unitize(normalizeZh(display).text);
      if (units.length === 0) continue;
      const key = surfaceKey(units);
      const previous = byKey.get(key);
      if (!previous || previous.score < score) byKey.set(key, { display, units, key, score });
    }
  }
  const entries = [...byKey.values()];
  modelCache.set(q, entries);
  return entries;
}

function evaluate(answer: readonly Unit[], model: ModelEntry, maxLight: number | undefined): Candidate {
  const { cost, ops } = align(answer, model.units, COSTS);
  const edits: Edit[] = [];
  let bad = 0;
  let badCritical = 0;
  let light = 0;
  let homophones = 0;
  const reject = (...units: Unit[]) => {
    bad++;
    if (units.some(isCritical)) badCritical++;
  };

  ops.forEach((op, index) => {
    if (op.kind === 'substitute') {
      if (isHomophonePair(op.a, op.b)) {
        homophones++;
        edits.push({ type: 'homophone', unit: op.a, expected: op.b });
      } else reject(op.a, op.b);
    } else if (op.kind === 'extra') {
      if (isLight(op.a)) {
        light++;
        edits.push({ type: 'extra', unit: op.a });
      } else reject(op.a);
    } else if (op.kind === 'missing') {
      if (isLight(op.b)) {
        light++;
        // Insert before the next answer unit, or after the last one.
        const next = ops.slice(index + 1).find((o) => o.kind !== 'missing');
        const at = next ? next.a.start : (answer[answer.length - 1]?.end ?? 0);
        edits.push({ type: 'missing', unit: op.b, at });
      } else reject(op.b);
    }
  });

  const allowedLight = maxLight ?? (model.units.length <= 4 ? 1 : 2);
  const allowedHomophones = Math.max(1, Math.floor(model.units.length / 3));
  const withinLimits = light <= allowedLight && homophones <= allowedHomophones;
  return {
    model,
    cost,
    acceptable: bad === 0 && withinLimits,
    close: bad === 1 && badCritical === 0 && withinLimits && model.units.length >= 2,
    edits,
  };
}

const EDIT_CODE = { homophone: 'homophone_char', extra: 'extra_word', missing: 'missing_word' } as const;

function editPenalty(edits: readonly Edit[], penalties: Penalties): number {
  return edits.reduce((sum, e) => sum + (penalties[EDIT_CODE[e.type]] ?? 0), 0);
}

function compare(answer: readonly Unit[], models: readonly ModelEntry[], q: ModelQuestion, penalties: Penalties) {
  const candidates = models.map((m) => evaluate(answer, m, q.options?.maxLightEdits));
  const value = (c: Candidate) => c.model.score - editPenalty(c.edits, penalties);
  const best = candidates.filter((c) => c.acceptable).sort((x, y) => value(y) - value(x) || x.cost - y.cost)[0];
  const closest = [...candidates].sort((x, y) => x.cost - y.cost || y.model.score - x.model.score)[0];
  return { best, closest };
}

/** Turns alignment edits into issues; `pos` maps unit positions to answer positions. */
function editIssues(edits: readonly Edit[], penalties: Penalties, pos: (i: number) => number): Issue[] {
  return edits.map((e) => {
    const code = EDIT_CODE[e.type];
    let message: string;
    let fix: Fix;
    if (e.type === 'homophone') {
      message = vi.homophone(e.unit.surface, e.expected.surface, pinyinOf(e.unit.surface), pinyinOf(e.expected.surface));
      fix = { start: pos(e.unit.start), end: pos(e.unit.end), replacement: e.expected.surface };
    } else if (e.type === 'extra') {
      message = vi.extraWord(e.unit.surface);
      fix = { start: pos(e.unit.start), end: pos(e.unit.end), replacement: '' };
    } else {
      message = vi.missingWord(e.unit.surface);
      fix = { start: pos(e.at), end: pos(e.at), replacement: e.unit.surface };
    }
    return { code, severity: ZH_SEVERITY[code], penalty: penalties[code] ?? 0, message, start: fix.start, end: fix.end, fix };
  });
}

type MatchKind = 'exact' | 'fixed' | 'plain';

interface Match {
  kind: MatchKind;
  model: ModelEntry;
  edits: Issue[];
  /** The part of the answer that matched. */
  start: number;
  end: number;
}

/** Compares text[start, end) with the model answers. */
function attempt(
  text: string,
  start: number,
  end: number,
  ruleIssues: readonly Issue[],
  models: readonly ModelEntry[],
  q: ModelQuestion,
  penalties: Penalties,
): { match?: Match; closest?: Candidate } {
  const sub = text.slice(start, end);
  const units = unitize(sub);
  if (units.length === 0) return {};
  const key = surfaceKey(units);
  const exact = models.filter((m) => m.key === key).sort((x, y) => y.score - x.score)[0];
  if (exact) return { match: { kind: 'exact', model: exact, edits: [], start, end } };

  const localFixes: Fix[] = ruleIssues.flatMap((i) =>
    i.fix && i.fix.start >= start && i.fix.end <= end ? [{ ...i.fix, start: i.fix.start - start, end: i.fix.end - start }] : [],
  );
  const fixed = localFixes.length > 0 ? applyFixes(sub, localFixes) : undefined;
  const viaFixes = fixed ? compare(unitize(fixed.text), models, q, penalties) : undefined;
  if (fixed && viaFixes?.best) {
    const map = fixed.toOriginal;
    const edits = editIssues(viaFixes.best.edits, penalties, (i) => (map[i] ?? i) + start);
    return { match: { kind: 'fixed', model: viaFixes.best.model, edits, start, end }, closest: viaFixes.closest };
  }
  const plain = compare(units, models, q, penalties);
  if (plain.best) {
    const edits = editIssues(plain.best.edits, penalties, (i) => i + start);
    return { match: { kind: 'plain', model: plain.best.model, edits, start, end }, closest: plain.closest };
  }
  const closest = [plain.closest, viaFixes?.closest]
    .filter((c): c is Candidate => c !== undefined)
    .sort((x, y) => x.cost - y.cost)[0];
  return closest ? { closest } : {};
}

const overlaps = (a: Issue, b: Issue) => a.start <= b.end && b.start <= a.end;

/** Issues of a matched answer, counting each mistake once. */
function matchIssues(match: Match, ruleIssues: readonly Issue[]): Issue[] {
  switch (match.kind) {
    case 'exact':
      // The matched part is a model answer: rule findings inside it are not mistakes.
      return ruleIssues.filter((r) => r.end <= match.start || r.start >= match.end);
    case 'fixed':
      return [...ruleIssues, ...match.edits];
    case 'plain':
      return [...ruleIssues.filter((r) => !match.edits.some((e) => overlaps(r, e))), ...match.edits];
  }
}

const matchValue = (m: Match) => m.model.score - m.edits.reduce((sum, e) => sum + e.penalty, 0);

export function gradeZhModel(q: ModelQuestion, answer: string): GradeResult {
  const penalties = resolvePenalties(ZH_DEFAULT_PENALTIES, q.penalties);
  const { text, convertedTraditional } = normalizeZh(answer);
  const models = modelsOf(q);
  const info: Issue[] = convertedTraditional
    ? [{ code: 'traditional_converted', severity: 'info', penalty: penalties.traditional_converted ?? 0, message: vi.traditional, start: 0, end: 0 }]
    : [];

  const empty = unitize(text).length === 0;
  if (empty || (!hasHan(text) && !/[0-9]/.test(text))) {
    return {
      score: 0,
      content: { status: 'no_answer', message: empty ? vi.empty : vi.notChinese },
      issues: info,
      normalized: text,
      ...(models[0] ? { suggestion: models[0].display } : {}),
      needsReview: false,
    };
  }

  const ruleIssues = runZhRules(analyzeZh(text), {
    penalties,
    countQuestion: false,
    allowArabicDigits: q.options?.allowArabicDigits ?? true,
  });
  const whole = attempt(text, 0, text.length, ruleIssues, models, q, penalties);
  let match = whole.match;
  let partial = false;
  if (!match) {
    const clauses = splitClauses(text).filter((c) => unitize(c.text).length > 0);
    if (clauses.length > 1) {
      for (const clause of clauses) {
        const found = attempt(text, clause.start, clause.end, ruleIssues, models, q, penalties).match;
        if (found && (!match || matchValue(found) > matchValue(match))) match = found;
      }
      partial = match !== undefined;
    }
  }

  if (match) {
    const issues = sortIssues([...info, ...matchIssues(match, ruleIssues)]);
    const score = clampScore(match.model.score - totalPenalty(issues));
    const result: GradeResult = {
      score,
      content: { status: 'correct', message: partial ? vi.modelPartial : score === 100 ? vi.perfect : vi.modelCorrect },
      issues,
      normalized: text,
      needsReview: partial,
      details: { matched: match.model.display, matchedPart: text.slice(match.start, match.end) },
    };
    if (issues.some((i) => i.penalty > 0)) {
      result.corrected = partial
        ? text.slice(0, match.start) + match.model.display.replace(/[。.！!？?]+$/u, '') + text.slice(match.end)
        : match.model.display;
    }
    return result;
  }

  const suggestion = whole.closest?.model.display ?? models[0]?.display;
  return {
    score: 0,
    content: { status: 'unmatched', message: vi.modelUnmatched },
    issues: sortIssues([...info, ...ruleIssues]),
    normalized: text,
    ...(suggestion ? { suggestion } : {}),
    needsReview: whole.closest?.close ?? false,
    details: { closest: whole.closest?.model.display ?? null },
  };
}
