/** Shows a grader result: score, verdict, highlighted mistakes and fixes. */
import { segments, ZH_ISSUE_LABELS_VI, type GradeResult } from '@c-learn-write/grader';
import { T } from '../strings';

export function scoreBand(score: number): 'good' | 'ok' | 'bad' {
  return score >= 90 ? 'good' : score >= 60 ? 'ok' : 'bad';
}

function AnswerText({ result }: { result: GradeResult }) {
  return (
    <p class="answer-text zh" lang="zh-CN">
      {segments(result.normalized, result.issues).map((seg, i) => {
        if (seg.kind === 'text') return seg.text;
        if (seg.kind === 'mark') {
          return (
            <mark key={i} class={seg.severity} title={seg.messages.join('\n')}>
              {seg.text}
            </mark>
          );
        }
        return (
          <span key={i} class="insert" title={seg.messages.join('\n')} aria-label={seg.messages.join(' ')}>
            ‸
          </span>
        );
      })}
    </p>
  );
}

export function GradeResultView({ result, compact = false }: { result: GradeResult; compact?: boolean }) {
  const band = scoreBand(result.score);
  return (
    <div class="grade-result">
      <div class="result-head">
        <div class={`score ${band}`} aria-label={T.result.scoreLabel(result.score)}>
          <span class="score-value">{result.score}</span>
          <span class="score-max">/100</span>
        </div>
        <div class="verdict">
          <p class={`status ${result.content.status}`}>{T.result.status[result.content.status]}</p>
          <p class="message">{result.content.message}</p>
        </div>
      </div>
      {result.needsReview && <p class="review-flag">{T.result.needsReview}</p>}
      {!compact && result.normalized && (
        <>
          <h3>{T.result.yourAnswer}</h3>
          <AnswerText result={result} />
        </>
      )}
      {result.issues.length > 0 && (
        <>
          <h3>{T.result.feedback}</h3>
          <ul class="issues">
            {result.issues.map((issue, i) => (
              <li key={i} class={`issue ${issue.severity}`}>
                <span class="issue-label">{ZH_ISSUE_LABELS_VI[issue.code as keyof typeof ZH_ISSUE_LABELS_VI] ?? issue.code}</span>
                <span class="issue-message">{issue.message}</span>
                <span class="issue-penalty">{issue.penalty > 0 ? `−${issue.penalty}` : '0'}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {result.corrected && (
        <p class="line">
          <strong>{T.result.corrected}</strong>{' '}
          <span class="zh" lang="zh-CN">
            {result.corrected}
          </span>
        </p>
      )}
      {result.suggestion && (
        <p class="line">
          <strong>{T.result.suggestion}</strong>{' '}
          <span class="zh" lang="zh-CN">
            {result.suggestion}
          </span>
        </p>
      )}
    </div>
  );
}
