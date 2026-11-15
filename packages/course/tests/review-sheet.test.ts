import { describe, expect, it } from 'vitest';
import curriculumFile from '../data/curriculum.json';
import grammar from '../data/hsk/grammar.json';
import vocabulary from '../data/hsk/vocabulary.json';
import lesson1 from '../data/lessons/hsk1/01.json';
import { parseCsv, parseCsvObjects, toCsv } from '../src/csv';
import { contentHash } from '../src/hash';
import { effectiveStatus } from '../src/review';
import { applyReviewRows, buildReviewRows, REVIEW_HEADER } from '../src/review-sheet';
import type { CurriculumLesson, LessonContent, OfficialWord } from '../src/types';

const src = { curriculum: curriculumFile.lessons as CurriculumLesson[], vocabulary: vocabulary as OfficialWord[], grammar };
const fresh = () => structuredClone(lesson1) as unknown as LessonContent;

/** Export, let the "teacher" edit some rows, read the CSV back. */
function roundTrip(content: LessonContent, edit: (rows: string[][]) => void): Record<string, string>[] {
  const rows = buildReviewRows([content], src);
  edit(rows);
  return parseCsvObjects(toCsv(rows, true));
}
const col = (name: (typeof REVIEW_HEADER)[number]) => REVIEW_HEADER.indexOf(name);

describe('review spreadsheet', () => {
  it('exports one row per word, grammar point and exercise', () => {
    const c = fresh();
    const rows = buildReviewRows([c], src);
    expect(rows[0]).toEqual([...REVIEW_HEADER]);
    expect(rows).toHaveLength(1 + c.words.length + c.grammar.length + c.exercises.length);
    expect(rows[1]!.slice(0, 5)).toEqual(['hsk1-01/tu/146', 'hsk1-01 Xin chào', 'Từ', '你', 'nǐ']);
    // The CSV survives a round trip unchanged (multi-line cells, quotes, BOM).
    expect(parseCsv(toCsv(rows, true))).toEqual(rows);
  });

  it('records approvals with the content hash, and changes requested with the note', () => {
    const c = fresh();
    const rows = roundTrip(c, (r) => {
      r[1]![col('Kết quả duyệt')] = 'Đạt';
      r[1]![col('Người duyệt')] = 'GV Lan';
      r[2]![col('Kết quả duyệt')] = 'cần sửa';
      r[2]![col('Góp ý')] = 'Thêm nghĩa "mình".';
    });
    const result = applyReviewRows([c], rows, '2026-12-01');
    expect(result).toEqual({ updated: 2, errors: [] });
    expect(c.words[0]!.review).toEqual({ status: 'approved', date: '2026-12-01', hash: contentHash(c.words[0]!), by: 'GV Lan' });
    expect(effectiveStatus(c.words[0]!)).toBe('approved');
    expect(c.words[1]!.review).toEqual({ status: 'changes_requested', date: '2026-12-01', note: 'Thêm nghĩa "mình".' });
    // Editing the item after approval cancels the approval.
    c.words[0]!.meaningsVi.push('cậu');
    expect(effectiveStatus(c.words[0]!)).toBe('draft');
  });

  it('refuses unknown verdicts, unknown rows and content changed since the export, writing nothing', () => {
    const c = fresh();
    const rows = roundTrip(c, (r) => {
      r[1]![col('Kết quả duyệt')] = 'được';
      r[3]![col('Kết quả duyệt')] = 'đạt';
      r[4]![col('Kết quả duyệt')] = 'cần sửa';
      r.push([...r[5]!.slice(0, 8), 'đạt', '', '', '']);
      r[r.length - 1]![0] = 'hsk1-01/tu/9999';
    });
    c.words[2]!.meaningsVi = ['anh ta'];
    const result = applyReviewRows([c], rows, '2026-12-01');
    expect(result.updated).toBe(0);
    expect(result.errors).toEqual([
      'dòng 2: "Kết quả duyệt" phải là "đạt" hoặc "cần sửa", không phải "được"',
      'dòng 4: nội dung của "hsk1-01/tu/200" đã thay đổi sau khi xuất bảng tính; hãy xuất lại và duyệt lại mục này',
      'dòng 5: "cần sửa" cần có góp ý',
      `dòng ${rows.length + 1}: không tìm thấy mục "hsk1-01/tu/9999"`,
    ]);
    expect(c.words[0]!.review).toEqual({ status: 'draft' });
  });
});
