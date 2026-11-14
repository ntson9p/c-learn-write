import type { Question } from '../src/core/types';

/** Every sample question in questions/<lang>/*.json, sorted by file name. */
const modules = import.meta.glob<Question>('./*/*.json', { eager: true, import: 'default' });

export const QUESTIONS: readonly Question[] = Object.keys(modules)
  .sort()
  .map((path) => modules[path]!);
