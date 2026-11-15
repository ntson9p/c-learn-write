/**
 * Fills generated fields of the lesson files and formats them:
 * - `py` of every sentence whose pinyin is missing or no longer matches
 *   its characters (count of syllables, or a syllable that is not a reading
 *   of its character);
 * - canonical JSON formatting.
 * Run: npm run content:fill -w @c-learn-write/course [-- hsk1-03 ...]
 */
import { PinyinWriter } from '../src/generate.ts';
import { stripTones } from '../src/pinyin.ts';
import { readingsOf } from '../src/readings.ts';
import type { Sentence } from '../src/types.ts';
import { loadCourseFiles, rel, writeLesson } from './lib/course-files.ts';

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);

function pinyinFits(s: Sentence): boolean {
  if (!s.py) return false;
  const hans = [...s.zh].filter(isHan);
  const syl = s.py.trim().split(/\s+/);
  return syl.length === hans.length && hans.every((ch, i) => readingsOf(ch).includes(stripTones(syl[i]!)) || (ch === '儿' && stripTones(syl[i]!) === 'r'));
}

const course = loadCourseFiles(process.argv.slice(2));
const writer = new PinyinWriter(course.vocabulary, course.names);
let filled = 0;
let changedFiles = 0;
for (const file of course.lessons) {
  const sentences: Sentence[] = [
    ...file.lesson.words.flatMap((w) => w.examples),
    ...file.lesson.grammar.flatMap((g) => g.examples),
  ];
  for (const s of sentences) {
    if (pinyinFits(s)) continue;
    s.py = writer.sentence(s.zh);
    filled++;
  }
  // Keep key order stable: zh, py, vi.
  const order = (s: Sentence) => ({ zh: s.zh, py: s.py, vi: s.vi });
  for (const w of file.lesson.words) w.examples = w.examples.map(order);
  for (const g of file.lesson.grammar) g.examples = g.examples.map(order);
  if (writeLesson(file)) {
    changedFiles++;
    console.log('updated', rel(file.path));
  }
}
console.log(`${filled} sentence(s) got pinyin; ${changedFiles} file(s) changed.`);
