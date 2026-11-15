/** Dictionary search, insensitive to tones and Vietnamese diacritics. */
import { stripTones, type OfficialWord, type WordContent } from '@c-learn-write/course';

/** Lower case without Vietnamese diacritics ("Học sinh" -> "hoc sinh"). */
export function foldVi(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().normalize('NFC');
}

/** Pinyin without tones, spaces or apostrophes ("xuésheng" -> "xuesheng"). */
export function foldPinyin(text: string): string {
  return stripTones(text).replace(/ü/g, 'v').replace(/[\s’'\-/]/g, '');
}

export interface DictEntry {
  official: OfficialWord;
  content: WordContent | null;
}

/** Entries matching the query, in syllabus order; an empty query matches all. */
export function searchWords(entries: readonly DictEntry[], query: string): DictEntry[] {
  const q = query.trim();
  if (!q) return [...entries];
  const qVi = foldVi(q);
  const qPy = foldPinyin(q);
  return entries.filter(({ official, content }) => {
    if (official.word.includes(q)) return true;
    if (qPy && /^[a-zv]+$/.test(qPy) && foldPinyin(official.pinyin).includes(qPy)) return true;
    if (foldVi(official.hanViet).includes(qVi)) return true;
    return content ? content.meaningsVi.some((m) => foldVi(m).includes(qVi)) : false;
  });
}
