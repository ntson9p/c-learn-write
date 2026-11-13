import { QUESTIONS } from '../questions';
import { grade, ZH_ISSUE_LABELS_VI, type ContentStatus, type GradeResult, type Question } from '../src';
import { segments } from './highlight';

const TYPE_LABELS: Record<Question['type'], string> = {
  count: 'Đếm số lượng',
  model: 'Đáp án mẫu',
  location: 'Hỏi nơi chốn',
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  correct: 'Đúng nội dung',
  wrong: 'Sai nội dung',
  no_answer: 'Chưa trả lời',
  unmatched: 'Chưa khớp đáp án',
};

const $ = <T extends HTMLElement>(id: string) => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} is missing`);
  return node as T;
};

const ui = {
  questions: $('questions'),
  picture: $('picture'),
  type: $('question-type'),
  prompt: $('prompt'),
  promptVi: $('prompt-vi'),
  form: $<HTMLFormElement>('answer-form'),
  answer: $<HTMLInputElement>('answer'),
  examples: $('examples'),
  result: $('result'),
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

let current: Question = QUESTIONS[0]!;

function scoreBand(score: number): 'good' | 'ok' | 'bad' {
  return score >= 90 ? 'good' : score >= 60 ? 'ok' : 'bad';
}

function renderQuestionList(): void {
  ui.questions.replaceChildren(
    ...QUESTIONS.map((q) => {
      const button = el('button', q.id === current.id ? 'chip active' : 'chip', q.title ?? q.prompt);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(q.id === current.id));
      button.addEventListener('click', () => selectQuestion(q));
      return button;
    }),
  );
}

function renderQuestion(): void {
  ui.picture.textContent = current.picture ?? '';
  ui.type.textContent = TYPE_LABELS[current.type];
  ui.prompt.textContent = current.prompt;
  ui.promptVi.textContent = current.promptVi ?? '';
  ui.examples.replaceChildren(
    ...(current.examples ?? []).map((ex) => {
      const button = el('button', 'chip example', el('span', '', ex.answer), el('span', `badge ${scoreBand(ex.score)}`, String(ex.score)));
      button.type = 'button';
      button.lang = 'zh-CN';
      if (ex.note) button.title = ex.note;
      button.addEventListener('click', () => {
        ui.answer.value = ex.answer;
        check();
      });
      return button;
    }),
  );
}

function renderAnswerText(result: GradeResult): HTMLElement {
  const p = el('p', 'answer-text');
  p.lang = 'zh-CN';
  for (const seg of segments(result.normalized, result.issues)) {
    if (seg.kind === 'text') p.append(seg.text);
    else if (seg.kind === 'mark') {
      const mark = el('mark', seg.severity, seg.text);
      mark.title = seg.messages.join('\n');
      p.append(mark);
    } else {
      const caret = el('span', 'insert', '‸');
      caret.title = seg.messages.join('\n');
      p.append(caret);
    }
  }
  return p;
}

function renderResult(answer: string, result: GradeResult): void {
  const band = scoreBand(result.score);
  const head = el(
    'div',
    'result-head',
    el('div', `score ${band}`, el('span', 'score-value', String(result.score)), el('span', 'score-max', '/100')),
    el(
      'div',
      'verdict',
      el('p', `status ${result.content.status}`, STATUS_LABELS[result.content.status]),
      el('p', 'message', result.content.message),
    ),
  );
  const parts: Node[] = [head];

  if (result.needsReview) parts.push(el('p', 'review', 'Cần giáo viên xem lại kết quả này.'));
  if (result.normalized) parts.push(el('h3', '', 'Câu trả lời'), renderAnswerText(result));

  if (result.issues.length > 0) {
    parts.push(
      el('h3', '', 'Nhận xét'),
      el(
        'ul',
        'issues',
        ...result.issues.map((issue) =>
          el(
            'li',
            `issue ${issue.severity}`,
            el('span', 'issue-label', ZH_ISSUE_LABELS_VI[issue.code as keyof typeof ZH_ISSUE_LABELS_VI] ?? issue.code),
            el('span', 'issue-message', issue.message),
            el('span', 'issue-penalty', issue.penalty > 0 ? `−${issue.penalty}` : '0'),
          ),
        ),
      ),
    );
  }
  if (result.corrected) parts.push(el('p', 'line', el('strong', '', 'Câu đã sửa: '), el('span', 'zh', result.corrected)));
  if (result.suggestion) parts.push(el('p', 'line', el('strong', '', 'Đáp án tham khảo: '), el('span', 'zh', result.suggestion)));

  const example = current.examples?.find((ex) => ex.answer === answer);
  if (example) {
    const same = example.score === result.score;
    parts.push(
      el(
        'p',
        `line expected ${same ? 'same' : 'different'}`,
        `Điểm mong đợi trong bộ ví dụ: ${example.score} ${same ? '✓' : '≠ ' + result.score}`,
        ...(example.note ? [el('span', 'note', ` · ${example.note}`)] : []),
      ),
    );
  }

  const details = el('details', 'details', el('summary', '', 'Chi tiết kỹ thuật'));
  details.append(el('pre', '', JSON.stringify({ normalized: result.normalized, ...result.details }, null, 2)));
  parts.push(details);

  ui.result.replaceChildren(...parts);
  ui.result.hidden = false;
}

function check(): void {
  const answer = ui.answer.value;
  renderResult(answer, grade(current, answer));
}

/** `initial`: first render, so neither touch the URL nor pop up a phone keyboard. */
function selectQuestion(q: Question, initial = false): void {
  current = q;
  if (!initial) history.replaceState(null, '', `#${q.id}`);
  ui.answer.value = '';
  ui.result.hidden = true;
  renderQuestionList();
  renderQuestion();
  if (!initial) ui.answer.focus({ preventScroll: true });
}

ui.form.addEventListener('submit', (event) => {
  event.preventDefault();
  check();
});

const fromHash = QUESTIONS.find((q) => `#${q.id}` === location.hash);
selectQuestion(fromHash ?? current, true);
