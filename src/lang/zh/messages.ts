/** Feedback for learners, in Vietnamese. */

const q = (s: string) => `「${s}」`;

export const vi = {
  empty: 'Bạn chưa nhập câu trả lời.',
  notChinese: 'Hãy trả lời bằng chữ Hán.',
  perfect: 'Hoàn toàn chính xác!',

  countCorrect: 'Đúng số lượng.',
  countWrong: (claim: number) => `Số lượng chưa đúng: bạn trả lời ${claim}. Hãy đếm lại nhé.`,
  countApproximate: 'Hãy nói một con số cụ thể, không dùng số ước lượng (như 四五个, 十几个).',
  countAmbiguous: (values: readonly number[]) =>
    `Bạn đưa ra nhiều con số khác nhau (${values.join(', ')}). Hãy chọn một con số.`,
  countNegated: 'Câu trả lời đang ở dạng phủ định, nhưng câu hỏi muốn biết có bao nhiêu.',
  countOther: (said: string, asked: string) => `Câu trả lời nói về ${q(said)}, nhưng câu hỏi hỏi về ${q(asked)}.`,
  countNear: (written: string, expected: string) => `Không rõ ${q(written)} là gì. Có phải bạn muốn viết ${q(expected)}?`,
  countNoNumber: (asked: string) => `Câu trả lời chưa nêu số lượng ${q(asked)}.`,

  modelCorrect: 'Câu trả lời đúng.',
  modelUnmatched: 'Câu trả lời chưa khớp với đáp án nào.',

  missingMeasure: (num: string, measure: string, rest: string, formal: boolean) =>
    `Thiếu lượng từ: giữa số và danh từ phải có lượng từ. Nói ${q(num + measure + rest)}, không nói ${q(num + rest)}` +
    (formal ? ` (kiểu ${q(num + rest)} chỉ dùng trong văn viết trang trọng).` : '.'),
  missingMeasureBare: (num: string, measure: string) =>
    `Thiếu lượng từ: nói ${q(num + measure)}, không nói ${q(num)} trống không.`,
  wrongMeasure: (noun: string, right: string, wrong: string) =>
    `Sai lượng từ: ${q(noun)} dùng lượng từ ${q(right)}, không dùng ${q(wrong)}.`,
  erLiang: (measure: string) =>
    measure
      ? `Trước lượng từ, số 2 phải dùng 「两」: nói ${q('两' + measure)}, không nói ${q('二' + measure)}.`
      : 'Trước lượng từ, số 2 phải dùng 「两」, không dùng 「二」.',
  liangMisuse: (wrong: string, right: string) =>
    `「两」 chỉ dùng khi đứng một mình trước lượng từ hoặc trước 百/千/万. Viết ${q(right)}, không viết ${q(wrong)}.`,
  diLiang: 'Số thứ tự viết là 「第二」, không viết 「第两」.',
  modifierOrder: (modifier: string, noun: string) =>
    `Sai trật tự từ: trong tiếng Trung, từ chỉ màu sắc/tính chất đứng trước danh từ. ` +
    `Nói ${q(modifier + noun)}, không nói ${q(noun + modifier)} (ngược với tiếng Việt).`,
  buYou: 'Phủ định của 「有」 là 「没有」, không dùng 「不有」.',
  homophone: (written: string, expected: string, writtenPinyin: string, expectedPinyin: string) =>
    writtenPinyin === expectedPinyin
      ? `Gõ nhầm chữ đồng âm: ${q(written)} → ${q(expected)} (cùng đọc ${expectedPinyin}).`
      : `Gõ nhầm chữ: ${q(written)} (${writtenPinyin}) → ${q(expected)} (${expectedPinyin}).`,
  missingWord: (word: string) => `Thiếu ${q(word)}.`,
  extraWord: (word: string) => `Thừa ${q(word)}.`,
  notFullSentence: (example: string) => `Hãy trả lời bằng câu đầy đủ, ví dụ: ${q(example)}.`,
  arabicDigits: (digits: string, zh: string) => `Hãy viết số bằng chữ Hán: ${q(zh)} thay cho ${q(digits)}.`,
  traditional: 'Câu trả lời có chữ phồn thể; đã chuyển sang chữ giản thể để chấm.',
};
