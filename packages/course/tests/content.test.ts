/**
 * Checks every lesson file. CONTENT_FILTER=hsk1-03,hsk1-04 limits the
 * reported problems to some lessons (useful while writing them).
 */
import { checkZhSentence, expandPattern } from '@c-learn-write/grader';
import { describe, expect, it } from 'vitest';
import curriculumFile from '../data/curriculum.json';
import grammar from '../data/hsk/grammar.json';
import vocabulary from '../data/hsk/vocabulary.json';
import levelsFile from '../data/levels.json';
import namesFile from '../data/names.json';
import { formatLesson } from '../scripts/lib/course-files';
import { readingsOf } from '../src/readings';
import type { CurriculumLesson, LessonContent, LevelStatus, OfficialWord } from '../src/types';
import { validateCourse } from '../src/validate';

const files = import.meta.glob<LessonContent>('../data/lessons/hsk*/*.json', { eager: true, import: 'default' });
const raw = import.meta.glob<string>('../data/lessons/hsk*/*.json', { eager: true, query: '?raw', import: 'default' });
const contents = Object.values(files);
const FILTER = (process.env.CONTENT_FILTER ?? '').split(',').filter(Boolean);
const keep = (id: string) => FILTER.length === 0 || FILTER.some((f) => id.startsWith(f));

/** Correct sentences of a lesson: none of them may raise a grader issue. */
function correctSentences(c: LessonContent): string[] {
  const out: string[] = [];
  for (const w of c.words) out.push(...w.examples.map((s) => s.zh));
  for (const g of c.grammar) out.push(...g.examples.map((s) => s.zh), ...(g.mistakes ?? []).map((m) => m.right));
  for (const ex of c.exercises) {
    if (ex.type === 'order') out.push(...ex.answers);
    if (ex.type === 'fill') out.push(...ex.answers.map((a) => ex.before + a + ex.after));
    if (ex.type === 'translate') {
      for (const a of ex.answers) {
        const spec = typeof a === 'string' ? { text: a, score: 100 } : a;
        if ((spec.score ?? 100) === 100) out.push(...expandPattern(spec.text));
      }
    }
  }
  return out;
}

describe('course content', () => {
  it('passes every check', () => {
    const errors = validateCourse(
      {
        vocabulary: vocabulary as OfficialWord[],
        grammar,
        names: namesFile.names,
        curriculum: curriculumFile.lessons as CurriculumLesson[],
        contents,
        levels: levelsFile.levels as Record<string, LevelStatus>,
      },
      readingsOf,
    ).filter(keep);
    expect(errors).toEqual([]);
  });

  it('names each file after its lesson and keeps the canonical format (npm run content:fill)', () => {
    for (const [path, content] of Object.entries(files)) {
      if (!keep(content.id ?? path)) continue;
      const m = /hsk(\d)\/(\d\d)\.json$/.exec(path);
      expect(m && `hsk${m[1]}-${m[2]}`, path).toBe(content.id);
      expect(raw[path], path).toBe(formatLesson(content));
    }
  });

  it('has correct sentences that the grader rules leave alone', () => {
    const flagged: string[] = [];
    for (const c of contents.filter((c) => keep(c.id))) {
      for (const s of correctSentences(c)) {
        const issues = checkZhSentence(s).issues;
        if (issues.length > 0) flagged.push(`${c.id}: 「${s}」 -> ${issues.map((i) => i.code).join(', ')}`);
      }
    }
    expect(flagged).toEqual([]);
  });
});
