/** Reads and writes the course data files (Node scripts). */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CurriculumLesson, LessonContent, LevelStatus, NameEntry, OfficialGrammar, OfficialWord } from '../../src/types.ts';

export const PKG = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA = join(PKG, 'data');

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

export interface LessonFile {
  path: string;
  lesson: LessonContent;
}

/** Lesson files, optionally only those whose id starts with one of `filters` ("hsk1-03", "hsk2"). */
export function lessonFiles(filters: readonly string[] = []): LessonFile[] {
  const root = join(DATA, 'lessons');
  const out: LessonFile[] = [];
  for (const dir of readdirSync(root).sort()) {
    const full = join(root, dir);
    if (!statSync(full).isDirectory()) continue;
    for (const f of readdirSync(full).sort()) {
      if (!f.endsWith('.json')) continue;
      const id = `${dir}-${f.replace(/\.json$/, '')}`;
      if (filters.length > 0 && !filters.some((x) => id.startsWith(x))) continue;
      out.push({ path: join(full, f), lesson: readJson<LessonContent>(join(full, f)) });
    }
  }
  return out;
}

/** Canonical formatting of a lesson file (2-space JSON, final newline). */
export function formatLesson(lesson: LessonContent): string {
  return `${JSON.stringify(lesson, null, 2)}\n`;
}

export function writeLesson(file: LessonFile): boolean {
  const text = formatLesson(file.lesson);
  const before = readFileSync(file.path, 'utf8');
  if (before === text) return false;
  writeFileSync(file.path, text, 'utf8');
  return true;
}

export function loadCourseFiles(filters: readonly string[] = []) {
  return {
    curriculum: readJson<{ lessons: CurriculumLesson[] }>(join(DATA, 'curriculum.json')).lessons,
    vocabulary: readJson<OfficialWord[]>(join(DATA, 'hsk', 'vocabulary.json')),
    grammar: readJson<OfficialGrammar[]>(join(DATA, 'hsk', 'grammar.json')),
    names: readJson<{ names: NameEntry[] }>(join(DATA, 'names.json')).names,
    levels: readJson<{ levels: Record<string, LevelStatus> }>(join(DATA, 'levels.json')).levels,
    lessons: lessonFiles(filters),
  };
}

export const rel = (path: string) => relative(PKG, path);
