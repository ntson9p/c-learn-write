/**
 * Dictionary segmentation for vocabulary control: which words does a sentence
 * use? The cut minimises unknown characters first, then words outside
 * `prefer` (e.g. words not taught yet), then the number of words: for a
 * lesson where 有 and 时间 are taught, 有时间 is 有 + 时间 even though 有时 + 间
 * are words too. Deterministic: remaining ties keep the earliest longest word.
 */

export interface Token {
  text: string;
  start: number;
  /** False for a Han character that no dictionary word covers. */
  known: boolean;
}

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);

export class Segmenter {
  private readonly words: ReadonlySet<string>;
  private readonly maxLen: number;

  constructor(words: Iterable<string>) {
    this.words = new Set(words);
    this.maxLen = Math.max(1, ...[...this.words].map((w) => [...w].length));
  }

  /** Han tokens of the text (punctuation, digits and Latin letters are skipped). */
  segment(text: string, prefer: (word: string) => boolean = () => true): Token[] {
    const out: Token[] = [];
    const chars = [...text];
    let i = 0;
    let offset = 0;
    const offsets: number[] = [];
    for (const ch of chars) {
      offsets.push(offset);
      offset += ch.length;
    }
    while (i < chars.length) {
      if (!isHan(chars[i]!)) {
        i++;
        continue;
      }
      let j = i;
      while (j < chars.length && isHan(chars[j]!)) j++;
      out.push(...this.segmentRun(chars.slice(i, j), offsets.slice(i, j), prefer));
      i = j;
    }
    return out;
  }

  private segmentRun(chars: string[], offsets: number[], prefer: (word: string) => boolean): Token[] {
    const n = chars.length;
    // best[i]: cost of chars[i..] as [unknown chars, words not preferred, words]; next[i]: first token length.
    type Cost = [number, number, number];
    const best: Cost[] = new Array(n + 1);
    const next: number[] = new Array(n).fill(1);
    best[n] = [0, 0, 0];
    const better = (a: Cost, b: Cost) => a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2])));
    const same = (a: Cost, b: Cost) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    for (let i = n - 1; i >= 0; i--) {
      const rest = (l: number) => best[i + l]!;
      const single = chars[i]!;
      let choice: Cost = this.words.has(single)
        ? [rest(1)[0], rest(1)[1] + (prefer(single) ? 0 : 1), rest(1)[2] + 1]
        : [rest(1)[0] + 1, rest(1)[1], rest(1)[2] + 1];
      let len = 1;
      for (let l = Math.min(this.maxLen, n - i); l >= 2; l--) {
        const word = chars.slice(i, i + l).join('');
        if (!this.words.has(word)) continue;
        const c: Cost = [rest(l)[0], rest(l)[1] + (prefer(word) ? 0 : 1), rest(l)[2] + 1];
        if (better(c, choice) || (same(c, choice) && l > len)) {
          choice = c;
          len = l;
        }
      }
      best[i] = choice;
      next[i] = len;
    }
    const tokens: Token[] = [];
    for (let i = 0; i < n; ) {
      const l = next[i]!;
      const text = chars.slice(i, i + l).join('');
      tokens.push({ text, start: offsets[i]!, known: this.words.has(text) });
      i += l;
    }
    return tokens;
  }
}
