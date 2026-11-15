/**
 * Prints what a lesson must teach and which words its sentences may use.
 * Run: npm run content:brief -w @c-learn-write/course -- hsk1-05
 */
import { loadCourseFiles } from './lib/course-files.ts';

const id = process.argv[2];
if (!id) {
  console.error('usage: npm run content:brief -- <lesson id, e.g. hsk1-05>');
  process.exit(1);
}
const course = loadCourseFiles();
const lesson = course.curriculum.find((l) => l.id === id);
if (!lesson) {
  console.error(`no lesson ${id} in data/curriculum.json`);
  process.exit(1);
}
const rank = (l: { level: number; order: number }) => l.level * 1000 + l.order;
const wordByNo = new Map(course.vocabulary.map((w) => [w.no, w]));
const grammarByNo = new Map(course.grammar.map((g) => [g.no, g]));
const fmt = (no: number) => {
  const w = wordByNo.get(no)!;
  return `${w.no} ${w.word}${w.sense ? `(${w.sense})` : ''} ${w.pinyin} [${w.pos.join('、')}] HV:${w.hanViet}`;
};

console.log(`# ${lesson.id}: ${lesson.titleVi} — ${lesson.topicVi}\n`);
console.log('## Words to teach (no, word, official pinyin, POS, Hán Việt)');
for (const no of lesson.words) console.log(`- ${fmt(no)}`);
console.log('\n## Grammar points to teach (official no | category | item | content)');
for (const no of lesson.grammar) {
  const g = grammarByNo.get(no)!;
  console.log(`- ${g.no} | ${g.category} ${g.categoryName} | ${g.item} | ${g.content}`);
}
console.log('\n## Words taught in earlier lessons (may be used freely)');
for (const l of course.curriculum.filter((x) => rank(x) < rank(lesson)).sort((a, b) => rank(a) - rank(b))) {
  console.log(`${l.id}: ${l.words.map((no) => wordByNo.get(no)!.word).join(' ')}`);
}
console.log(`\n## Grammar taught earlier: ${course.curriculum.filter((x) => rank(x) < rank(lesson)).flatMap((l) => l.grammar).join(', ') || '-'}`);
console.log(`\n## Names allowed everywhere: ${course.names.map((n) => `${n.zh} (${n.vi})`).join(', ')}`);
const morphemes = course.lessons
  .filter((f) => {
    const l = course.curriculum.find((c) => c.id === f.lesson.id);
    return l && rank(l) <= rank(lesson);
  })
  .flatMap((f) => f.lesson.grammar.flatMap((g) => g.morphemes ?? []));
console.log(`\n## Morphemes taught so far: ${morphemes.join(' ') || '-'}`);
