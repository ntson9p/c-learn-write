import type { Severity } from '../../core/types';

export type ZhIssueCode =
  | 'missing_measure_word'
  | 'wrong_measure_word'
  | 'er_liang'
  | 'liang_misuse'
  | 'modifier_order'
  | 'bu_you'
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
  homophone_char: 'Gõ nhầm chữ',
  missing_word: 'Thiếu từ',
  extra_word: 'Thừa từ',
  not_full_sentence: 'Chưa thành câu',
  arabic_digits: 'Chữ số',
  traditional_converted: 'Chữ phồn thể',
};
