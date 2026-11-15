/**
 * Dictionary segmentation for vocabulary control: which words does a sentence
 * use? The cut minimises unknown characters first, then the number of words,
 * so 有时间 is 有 + 时间 rather than 有时 + 间. Deterministic: ties keep the
 * earliest longest word.
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
  segment(text: string): Token[] {
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
      out.push(...this.segmentRun(chars.slice(i, j), offsets.slice(i, j)));
      i = j;
    }
    return out;
  }

  private segmentRun(chars: string[], offsets: number[]): Token[] {
    const n = chars.length;
    // best[i]: cost of chars[i..] as [unknown chars, words]; next[i]: length of the first token.
    const best: [number, number][] = new Array(n + 1);
    const next: number[] = new Array(n).fill(1);
    best[n] = [0, 0];
    for (let i = n - 1; i >= 0; i--) {
      let choice: [number, number] = [best[i + 1]![0] + 1, best[i + 1]![1] + 1];
      let len = 1;
      const single = chars[i]!;
      if (this.words.has(single)) choice = [best[i + 1]![0], best[i + 1]![1] + 1];
      for (let l = Math.min(this.maxLen, n - i); l >= 2; l--) {
        if (!this.words.has(chars.slice(i, i + l).join(''))) continue;
        const c: [number, number] = [best[i + l]![0], best[i + l]![1] + 1];
        if (c[0] < choice[0] || (c[0] === choice[0] && c[1] < choice[1]) || (c[0] === choice[0] && c[1] === choice[1] && l > len)) {
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
