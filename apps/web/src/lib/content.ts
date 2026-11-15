/**
 * Course content for the screens: levels are loaded once and cached; words
 * and grammar points can be looked up by their official number.
 */
import { loadLevel, loadNames, loadVocabulary, type GrammarContent, type Lesson, type Level, type NameEntry, type OfficialWord, type WordContent } from '@c-learn-write/course';

const levels = new Map<Level, Promise<Lesson[]>>();
let vocabulary: Promise<Map<number, OfficialWord>> | undefined;
let names: Promise<NameEntry[]> | undefined;

export function lessonsOf(level: Level): Promise<Lesson[]> {
  let p = levels.get(level);
  if (!p) {
    p = loadLevel(level);
    levels.set(level, p);
  }
  return p;
}

export function officialWords(): Promise<Map<number, OfficialWord>> {
  vocabulary ??= loadVocabulary().then((list) => new Map(list.map((w) => [w.no, w])));
  return vocabulary;
}

export function properNames(): Promise<NameEntry[]> {
  names ??= loadNames();
  return names;
}

export const levelOfLesson = (lessonId: string): Level => Number(lessonId.slice(3, 4)) as Level;

export async function findLesson(lessonId: string): Promise<Lesson | undefined> {
  if (!/^hsk[123]-\d\d$/.test(lessonId)) return undefined;
  return (await lessonsOf(levelOfLesson(lessonId))).find((l) => l.meta.id === lessonId);
}

export interface WordEntry {
  official: OfficialWord;
  content: WordContent | null;
  /** Lesson that teaches the word (curriculum), when any. */
  lesson: Lesson | null;
}

/** Everything known about one word. */
export async function findWord(no: number): Promise<WordEntry | undefined> {
  const official = (await officialWords()).get(no);
  if (!official || official.level > 3) return undefined;
  const lessons = await lessonsOf(official.level as Level);
  const lesson = lessons.find((l) => l.meta.words.includes(no)) ?? null;
  const content = lesson?.content?.words.find((w) => w.no === no) ?? null;
  return { official, content, lesson };
}

export async function findGrammar(no: number): Promise<{ content: GrammarContent | null; lesson: Lesson } | undefined> {
  for (const level of [1, 2, 3] as const) {
    const lesson = (await lessonsOf(level)).find((l) => l.meta.grammar.includes(no));
    if (lesson) return { lesson, content: lesson.content?.grammar.find((g) => g.no === no) ?? null };
  }
  return undefined;
}
