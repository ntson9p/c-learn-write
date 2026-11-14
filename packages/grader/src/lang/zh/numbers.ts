/**
 * Chinese numerals: parsing (四, 十四, 两千三, 4) and formatting (14 -> 十四).
 */

const DIGITS: Readonly<Record<string, number>> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
  壹: 1, 贰: 2, 叁: 3, 肆: 4, 伍: 5, 陆: 6, 柒: 7, 捌: 8, 玖: 9,
};
const SMALL_UNITS: Readonly<Record<string, number>> = { 十: 10, 拾: 10, 百: 100, 佰: 100, 千: 1000, 仟: 1000 };
const BIG_UNITS: Readonly<Record<string, number>> = { 万: 1e4, 亿: 1e8 };

const NUMERAL_CHARS = [...Object.keys(DIGITS), ...Object.keys(SMALL_UNITS), ...Object.keys(BIG_UNITS)].join('');

/** Matches a run of Arabic digits or a run of Chinese numeral characters. */
export const NUMERAL_RUN = new RegExp(`[0-9]+|[${NUMERAL_CHARS}]+`, 'g');

export function isNumeralChar(ch: string | undefined): boolean {
  return ch !== undefined && (ch in DIGITS || ch in SMALL_UNITS || ch in BIG_UNITS || (ch >= '0' && ch <= '9'));
}

export interface ParsedNumber {
  value: number;
  /** Set for "A or B" forms such as 四五 or 两三; value is the lower bound. */
  range?: [number, number];
  /** Read digit by digit, as in years (二〇二六). */
  digitString: boolean;
  /** Offsets (inside the numeral) where 两 is used wrongly, as in 十两. */
  liangMisuse: number[];
}

const isUnit = (ch: string | undefined) => ch !== undefined && (ch in SMALL_UNITS || ch in BIG_UNITS);

/**
 * 两 may stand alone, start a number before 百/千/万/亿 (两百) or start an
 * "A or B" pair (两三). It is wrong before 十 (两十) and as the last digit of a
 * compound number (十两, 一百零两).
 */
function findLiangMisuse(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '两') continue;
    const next = text[i + 1];
    const prev = text[i - 1];
    if (next === '十' || next === '拾') out.push(i);
    else if (next === undefined && (isUnit(prev) || prev === '零' || prev === '〇')) out.push(i);
  }
  return out;
}

/** Parses one numeral run; returns null when it is not a well-formed number. */
export function parseZhNumber(text: string): ParsedNumber | null {
  if (text.length === 0) return null;
  if (/^[0-9]+$/.test(text)) {
    const value = Number(text);
    return Number.isSafeInteger(value) ? { value, digitString: false, liangMisuse: [] } : null;
  }
  const chars = [...text];
  if (!chars.every((ch) => ch in DIGITS || ch in SMALL_UNITS || ch in BIG_UNITS)) return null;
  const liangMisuse = findLiangMisuse(text);

  if (!chars.some((ch) => isUnit(ch))) {
    const digits = chars.map((ch) => DIGITS[ch]!);
    if (digits.length === 1) return { value: digits[0]!, digitString: false, liangMisuse };
    const [first, second] = digits as [number, number];
    if (digits.length === 2 && first >= 1 && second === first + 1) {
      return { value: first, range: [first, second], digitString: false, liangMisuse: [] };
    }
    return { value: Number(digits.join('')), digitString: true, liangMisuse };
  }

  let total = 0; // completed 亿 groups
  let wanPart = 0; // completed 万 group
  let section = 0; // below 万
  let digit: number | null = null;
  let digitAfterUnit = false;
  let prevWasUnit = false;
  let lastUnit = 0;
  let lastSmallUnit = Infinity;

  for (const ch of chars) {
    if (ch in DIGITS) {
      const d = DIGITS[ch]!;
      if (d === 0) {
        digit = null;
        prevWasUnit = false;
        continue;
      }
      if (digit !== null) return null; // two digits in a row
      digit = d;
      digitAfterUnit = prevWasUnit;
      prevWasUnit = false;
      continue;
    }
    if (ch in SMALL_UNITS) {
      const unit = SMALL_UNITS[ch]!;
      if (unit >= lastSmallUnit) return null; // 十百, 十十
      if (digit === null && prevWasUnit) return null; // 百十
      section += (digit ?? 1) * unit;
      lastSmallUnit = unit;
      lastUnit = unit;
      digit = null;
      prevWasUnit = true;
      continue;
    }
    const big = BIG_UNITS[ch]!;
    const group = section + (digit ?? 0);
    if (big === 1e4) {
      if (wanPart !== 0) return null; // 万 twice in the same 亿 group
      wanPart = (group || 1) * 1e4;
    } else {
      total += (wanPart + group || 1) * 1e8;
      wanPart = 0;
    }
    section = 0;
    digit = null;
    lastUnit = big;
    lastSmallUnit = Infinity;
    prevWasUnit = true;
  }

  if (digit !== null) {
    // 一百五 = 150, 两千三 = 2300, 三万五 = 35000: a final digit right after
    // a unit of 100 or more stands for the next lower unit.
    section += digitAfterUnit && lastUnit >= 100 ? (digit * lastUnit) / 10 : digit;
  }
  const value = total + wanPart + section;
  return Number.isSafeInteger(value) ? { value, digitString: false, liangMisuse } : null;
}

const DIGIT_CHARS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

function section4(n: number): string {
  const parts = [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
  const units = ['千', '百', '十', ''];
  let out = '';
  let pendingZero = false;
  parts.forEach((d, i) => {
    if (d === 0) {
      if (out) pendingZero = true;
      return;
    }
    if (pendingZero) out += '零';
    pendingZero = false;
    out += DIGIT_CHARS[d]! + units[i]!;
  });
  return out;
}

/**
 * Writes a non-negative integer below 100 000 000 in Chinese characters.
 * With beforeMeasure, 2 is written 两 (两个, not 二个).
 */
export function toZhNumeral(n: number, options: { beforeMeasure?: boolean } = {}): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1e8) return String(n);
  if (n === 0) return '零';
  if (n === 2 && options.beforeMeasure) return '两';
  const high = Math.floor(n / 1e4);
  const low = n % 1e4;
  let out = '';
  if (high > 0) {
    out += section4(high) + '万';
    if (low > 0 && low < 1000) out += '零';
  }
  if (low > 0) out += section4(low);
  return out.startsWith('一十') ? out.slice(1) : out;
}
