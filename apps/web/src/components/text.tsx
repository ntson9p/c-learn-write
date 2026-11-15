/** Text helpers: Chinese runs get lang="zh-CN", **bold** markup, pinyin ruby. */
import type { ComponentChildren } from 'preact';
import { effectiveStatus } from '@c-learn-write/course';
import { settings } from '../lib/settings';
import { T } from '../strings';

const HAN_RUN = /(\p{Script=Han}+)/u;
const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);

/** Wraps runs of Chinese characters so they get the Chinese font and language. */
export function zhRuns(text: string): ComponentChildren[] {
  return text.split(HAN_RUN).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} class="zh" lang="zh-CN">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Explanation text: `**bold**` is rendered bold; Chinese gets its font. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') && p.length > 4 ? <strong key={i}>{zhRuns(p.slice(2, -2))}</strong> : <span key={i}>{zhRuns(p)}</span>,
      )}
    </>
  );
}

/** A Chinese sentence with its pinyin above each character (when enabled). */
export function Pinyin({ zh, py, show }: { zh: string; py?: string; show?: boolean }) {
  const visible = show ?? settings.value.showPinyin;
  const syllables = (py ?? '').trim().split(/\s+/).filter(Boolean);
  const chars = [...zh];
  const hanCount = chars.filter(isHan).length;
  if (!visible || syllables.length !== hanCount) {
    return (
      <span class="zh" lang="zh-CN">
        {zh}
      </span>
    );
  }
  let k = 0;
  return (
    <span class="zh pinyin-line" lang="zh-CN">
      {chars.map((ch, i) =>
        isHan(ch) ? (
          <ruby key={i}>
            {ch}
            <rt lang="zh-Latn-pinyin">{syllables[k++]}</rt>
          </ruby>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </span>
  );
}

/** "Chưa duyệt" badge for content not approved by a teacher. */
export function DraftBadge({ item }: { item: { review?: { status: 'draft' | 'approved' | 'changes_requested'; hash?: string } } }) {
  if (effectiveStatus(item) === 'approved') return null;
  return (
    <span class="badge draft" title={T.draftHint}>
      {T.draftBadge}
    </span>
  );
}
