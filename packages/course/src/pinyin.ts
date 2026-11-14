/**
 * Pinyin helpers without dependencies: tone numbers, tone-less forms and the
 * alignment of a written pinyin string (as in the syllabus: "bāozi",
 * "bú kèqi", "nǚ’ér", "yìdiǎnr") with the characters of its word.
 *
 * Alignment does not use a table of syllables: each character brings its own
 * possible readings (see readings.ts), and the pinyin is cut so that every
 * piece is a reading of its character.
 */

/** Combining tone marks for tones 1-4 (macron, acute, caron, grave). */
const TONE_MARKS = [0x304, 0x301, 0x30c, 0x300].map((c) => String.fromCharCode(c));
const TONE_MARK_RE = new RegExp(`[${TONE_MARKS.join('')}]`, 'g');
const DIAERESIS = String.fromCharCode(0x308);

/** Tone of one syllable: 1-4, or 5 for the neutral tone (no mark). */
export function toneOf(syllable: string): number {
  const decomposed = syllable.normalize('NFD');
  for (let t = 0; t < TONE_MARKS.length; t++) if (decomposed.includes(TONE_MARKS[t]!)) return t + 1;
  return 5;
}

/** Lower-case pinyin without tone marks; ü is kept ("lǜ" -> "lü"). */
export function stripTones(text: string): string {
  return text.normalize('NFD').replace(TONE_MARK_RE, '').normalize('NFC').toLowerCase();
}

/** "lǜ" -> "lü4", "zi" -> "zi5". */
export function numbered(syllable: string): string {
  return stripTones(syllable) + toneOf(syllable);
}

/** True for a letter that can appear in written pinyin (a-z, ü, tone-marked vowels). */
export function isPinyinLetter(ch: string): boolean {
  const base = ch.normalize('NFD').replace(TONE_MARK_RE, '').replace(DIAERESIS, '');
  return /^[a-z]$/i.test(base);
}

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);

/** The first alternative of "shéi/shuí", without separators other than spaces. */
function cleanWritten(pinyin: string): string {
  return (pinyin.split('/')[0] ?? '').replace(/[’'‘\-]/g, ' ').trim();
}

export type ReadingsOf = (ch: string) => readonly string[];

/**
 * Cuts the written pinyin of a word into one syllable per Han character,
 * keeping tone marks (lower case). Returns null when no cut makes every piece
 * a reading of its character. Erhua is handled: 一点儿 "yìdiǎnr" ->
 * ["yì", "diǎn", "r"].
 */
export function alignWordPinyin(word: string, pinyin: string, readingsOf: ReadingsOf): string[] | null {
  const chars = [...word].filter(isHan);
  // Letters of the written pinyin, each kept with its tone marks.
  const letters: string[] = [];
  const breaks = new Set<number>();
  for (const ch of cleanWritten(pinyin).normalize('NFC')) {
    if (ch === ' ') breaks.add(letters.length);
    else if (isPinyinLetter(ch)) letters.push(ch.toLowerCase());
    else return null;
  }
  const plain = letters.map((l) => stripTones(l));

  const out: string[] = [];
  const solve = (ci: number, li: number): boolean => {
    if (ci === chars.length) return li === letters.length;
    const ch = chars[ci]!;
    const options = new Set(readingsOf(ch).map((r) => stripTones(r)));
    if (ch === '儿') options.add('r');
    // Longer readings first, so that "xian" is not cut into "xi" + "an".
    for (const reading of [...options].sort((a, b) => b.length - a.length)) {
      const n = [...reading].length;
      if (li + n > letters.length) continue;
      if (plain.slice(li, li + n).join('') !== reading) continue;
      // A space can only fall between syllables.
      let crossesBreak = false;
      for (let k = li + 1; k < li + n; k++) if (breaks.has(k)) crossesBreak = true;
      if (crossesBreak) continue;
      out.push(letters.slice(li, li + n).join('').normalize('NFC'));
      if (solve(ci + 1, li + n)) return true;
      out.pop();
    }
    return false;
  };
  return solve(0, 0) ? out : null;
}
