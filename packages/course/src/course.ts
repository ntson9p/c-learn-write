/**
 * Course data for the app: the curriculum (small, loaded at once) and the
 * lesson contents, loaded on demand one level at a time.
 */
import curriculumFile from '../data/curriculum.json';
import levelsFile from '../data/levels.json';
import type { CurriculumLesson, Lesson, LessonContent, LevelStatus, NameEntry, OfficialGrammar, OfficialWord } from './types.ts';

export type Level = 1 | 2 | 3;
export const LEVELS: readonly Level[] = [1, 2, 3];
export const LEVEL_STATUS = levelsFile.levels as Readonly<Record<string, LevelStatus>>;
export const CURRICULUM = curriculumFile.lessons as readonly CurriculumLesson[];

const contentLoaders = import.meta.glob<LessonContent>('../data/lessons/hsk*/*.json', { import: 'default' });
const contentPath = (l: CurriculumLesson) => `../data/lessons/hsk${l.level}/${String(l.order).padStart(2, '0')}.json`;

/** Curriculum lessons of a level, in order. */
export function curriculumOf(level: Level): CurriculumLesson[] {
  return CURRICULUM.filter((l) => l.level === level).sort((a, b) => a.order - b.order);
}

/** True when the lesson's content has been written. */
export function hasContent(lesson: CurriculumLesson): boolean {
  return contentPath(lesson) in contentLoaders;
}

/** Lessons of a level with their content (null when not written yet). */
export async function loadLevel(level: Level): Promise<Lesson[]> {
  return Promise.all(
    curriculumOf(level).map(async (meta) => {
      const load = contentLoaders[contentPath(meta)];
      return { meta, content: load ? await load() : null };
    }),
  );
}

export async function loadVocabulary(): Promise<OfficialWord[]> {
  return (await import('../data/hsk/vocabulary.json')).default as OfficialWord[];
}

export async function loadGrammarList(): Promise<OfficialGrammar[]> {
  return (await import('../data/hsk/grammar.json')).default as OfficialGrammar[];
}

export async function loadNames(): Promise<NameEntry[]> {
  return (await import('../data/names.json')).default.names as NameEntry[];
}

export async function loadCharacters(): Promise<{ recognition: Record<string, string[]>; handwriting: Record<string, string[]> }> {
  return (await import('../data/hsk/characters.json')).default;
}

/** Word id used by the app's storage: "w0001". */
export const wordId = (no: number) => `w${String(no).padStart(4, '0')}`;
/** Grammar id: "g005". */
export const grammarId = (no: number) => `g${String(no).padStart(3, '0')}`;
