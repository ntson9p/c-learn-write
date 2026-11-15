import type { Fix, Issue, Severity } from '../../core/types';

export type ZhIssueCode =
  | 'missing_measure_word'
  | 'wrong_measure_word'
  | 'er_liang'
  | 'liang_misuse'
  | 'modifier_order'
  | 'bu_you'
  | 'place_order'
  | 'localizer_order'
  | 'missing_localizer'
  | 'extra_localizer'
  | 'homophone_char'
  | 'missing_word'
  | 'extra_word'
  | 'not_full_sentence'
  | 'arabic_digits'
  | 'traditional_converted';

/** Default points removed per issue; questions can override them. */
export const ZH_DEFAULT_PENALTIES: Readonly<Record<ZhIssueCode, number>> = {
  missing_measure_word: 20,
  wrong_measure_word: 20,
  er_liang: 10,
  liang_misuse: 10,
  modifier_order: 20,
  bu_you: 20,
  place_order: 20,
  localizer_order: 20,
  missing_localizer: 20,
  extra_localizer: 10,
  homophone_char: 5,
  missing_word: 15,
  extra_word: 15,
  not_full_sentence: 20,
  arabic_digits: 5,
  traditional_converted: 0,
};

export const ZH_SEVERITY: Readonly<Record<ZhIssueCode, Severity>> = {
  missing_measure_word: 'error',
  wrong_measure_word: 'error',
  er_liang: 'error',
  liang_misuse: 'error',
  modifier_order: 'error',
  bu_you: 'error',
  place_order: 'error',
  localizer_order: 'error',
  missing_localizer: 'error',
  extra_localizer: 'error',
  homophone_char: 'typo',
  missing_word: 'error',
  extra_word: 'error',
  not_full_sentence: 'error',
  arabic_digits: 'error',
  traditional_converted: 'info',
};

/** Short Vietnamese labels, e.g. for badges in a user interface. */
export const ZH_ISSUE_LABELS_VI: Readonly<Record<ZhIssueCode, string>> = {
  missing_measure_word: 'Thiếu lượng từ',
  wrong_measure_word: 'Sai lượng từ',
  er_liang: '二 → 两',
  liang_misuse: '两 → 二',
  modifier_order: 'Sai trật tự từ',
  bu_you: '不有 → 没有',
  place_order: 'Vị trí cụm nơi chốn',
  localizer_order: 'Vị trí phương vị từ',
  missing_localizer: 'Thiếu phương vị từ',
  extra_localizer: 'Thừa phương vị từ',
  homophone_char: 'Gõ nhầm chữ',
  missing_word: 'Thiếu từ',
  extra_word: 'Thừa từ',
  not_full_sentence: 'Chưa thành câu',
  arabic_digits: 'Chữ số',
  traditional_converted: 'Chữ phồn thể',
};

/** Builds an issue with the severity of its code and the question's penalty. */
export function zhIssue(
  penalties: Readonly<Record<string, number>>,
  code: ZhIssueCode,
  start: number,
  end: number,
  message: string,
  fix?: Fix,
): Issue {
  const issue: Issue = { code, severity: ZH_SEVERITY[code], penalty: penalties[code] ?? 0, message, start, end };
  if (fix) issue.fix = fix;
  return issue;
}
