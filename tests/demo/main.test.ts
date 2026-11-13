// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from 'vitest';
import html from '../../demo/index.html?raw';
import { QUESTIONS } from '../../questions';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`${selector} not found`);
  return node;
};

const clickExample = (answer: string) => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('#examples button')].find(
    (b) => b.firstElementChild?.textContent === answer,
  );
  if (!button) throw new Error(`example ${answer} not found`);
  button.click();
};

beforeAll(async () => {
  // The page's own <script> tag is dropped: the test imports main.ts itself.
  const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? '';
  document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/g, '');
  await import('../../demo/main');
});

describe('demo page', () => {
  it('lists the questions and shows the first one', () => {
    expect(document.querySelectorAll('#questions button')).toHaveLength(QUESTIONS.length);
    expect($('#prompt').textContent).toBe(QUESTIONS[0]?.prompt);
    expect($('#result').hidden).toBe(true);
    expect(document.querySelectorAll('#examples button').length).toBe(QUESTIONS[0]?.examples?.length);
  });

  it('grades an example when it is clicked', () => {
    clickExample('有四苹果。');
    expect($('#result').hidden).toBe(false);
    expect($('.score-value').textContent).toBe('80');
    expect($('.issue-label').textContent).toBe('Thiếu lượng từ');
    expect($('.answer-text mark').textContent).toBe('四苹果');
    expect($('.expected').textContent).toContain('80 ✓');
  });

  it('grades a typed answer on submit', () => {
    $<HTMLInputElement>('#answer').value = '有四个绿苹果';
    $('#answer-form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect($('.score-value').textContent).toBe('100');
    expect($('.status').textContent).toBe('Đúng nội dung');
    expect(document.querySelector('.issues')).toBeNull();
  });

  it('shows the review flag and the reference answer', () => {
    $<HTMLInputElement>('#answer').value = '有四个绿苹里';
    $('#answer-form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect($('.score-value').textContent).toBe('20');
    expect($('.review').textContent).toContain('giáo viên');
    expect(document.body.textContent).toContain('Đáp án tham khảo: 图片里有四个绿苹果。');
  });

  it('grades location questions', () => {
    const book = QUESTIONS.find((q) => q.id === 'zh-location-book')!;
    [...document.querySelectorAll<HTMLButtonElement>('#questions button')].find((b) => b.textContent === book.title)?.click();
    expect($('#question-type').textContent).toBe('Hỏi nơi chốn');
    clickExample('书在里书包。');
    expect($('.score-value').textContent).toBe('80');
    expect($('.issue-label').textContent).toBe('Vị trí phương vị từ');
    expect(document.body.textContent).toContain('Câu đã sửa: 书在书包里。');
  });

  it('switches questions and remembers the choice in the URL', () => {
    const cats = QUESTIONS.find((q) => q.id === 'zh-count-cats')!;
    const button = [...document.querySelectorAll<HTMLButtonElement>('#questions button')].find((b) => b.textContent === cats.title);
    button?.click();
    expect($('#prompt').textContent).toBe(cats.prompt);
    expect(location.hash).toBe('#zh-count-cats');
    expect($('#result').hidden).toBe(true);
    clickExample('有二个猫。');
    expect($('.score-value').textContent).toBe('70');
    expect(document.querySelectorAll('.issue')).toHaveLength(2);
  });
});
