# c-learn-write

Bộ chấm câu trả lời tự luận ngắn cho người học tiếng Trung, **không dùng LLM/AI**: chấm bằng luật ngôn ngữ, chạy hoàn toàn trên máy (trình duyệt hoặc Node.js), nhận xét bằng tiếng Việt.

> **Trạng thái: prototype.** Bảng lượng từ và các luật cần được giáo viên tiếng Trung duyệt trước khi dùng thật (xem [docs/design.md](docs/design.md#dữ-liệu-cần-giáo-viên-duyệt)).

Ví dụ với câu hỏi 图片里有几个绿苹果？ (trong hình có 4 quả táo xanh, 2 quả táo đỏ):

| Câu trả lời | Điểm | Nhận xét |
|---|---|---|
| 图片里有四个绿苹果。 | 100 | Hoàn toàn chính xác |
| 有四个。 | 100 | Câu rút gọn, rất tự nhiên |
| 有四苹果。 | 80 | Thiếu lượng từ: nói 「四个苹果」 |
| 有四本苹果。 | 80 | Sai lượng từ: 「苹果」 dùng 「个」 |
| 有四个苹果绿。 | 80 | Sai trật tự từ: nói 「绿苹果」 (ngược với tiếng Việt) |
| 有四个绿平果。 | 95 | Gõ nhầm chữ đồng âm: 「平」 → 「苹」 |
| 图片里有六个苹果，四个是绿的。 | 100 | Nhận ra 4 quả nào là táo xanh |
| 有四个红苹果和两个绿苹果。 | 20 | Sai nội dung: táo xanh chỉ có 2 quả |
| 有十四个绿苹果。 | 20 | Sai số lượng, dù có chứa chữ 四 |
| 我喜欢苹果。 | 0 | Chưa nêu số lượng |

## Chạy thử

Yêu cầu: Node.js 22.12 trở lên (đã thử với Node 24.21).

```sh
npm install
npm run demo      # trang demo: mở http://localhost:5173
npm test          # chạy toàn bộ test
npm run check     # kiểm tra kiểu TypeScript + test
```

Mở trang demo trên điện thoại (cùng mạng Wi-Fi): chạy `npm run demo -- --host` rồi mở địa chỉ "Network" mà Vite in ra.

Trên trang demo, chọn một câu hỏi, gõ câu trả lời hoặc bấm một câu trong mục "Thử nhanh". Kết quả gồm điểm, lời nhận xét cho từng lỗi (kèm số điểm bị trừ), câu đã sửa, đáp án tham khảo, và cờ "Cần giáo viên xem lại" khi bộ chấm không chắc chắn.

## Dùng trong code

```ts
import { grade, type Question } from './src';
import data from './questions/zh/01-count-green-apples.json';

const question = data as Question;
const result = grade(question, '有四苹果。');
result.score; // 80
result.content; // { status: 'correct', message: 'Đúng số lượng.' }
result.issues; // [{ code: 'missing_measure_word', penalty: 20, message: 'Thiếu lượng từ: …', start: 1, end: 4, fix: … }]
result.corrected; // '有四个苹果。'
result.needsReview; // false
```

Bộ chấm là code TypeScript thuần, không gọi mạng và không phụ thuộc vào trình duyệt, nên dùng được ngay trong app web hoặc app di động viết bằng JavaScript.

## Cách chấm

```
Câu trả lời
   ↓
1. Chuẩn hóa       bỏ dấu cách, chữ số/chữ cái full-width → ASCII, phồn thể → giản thể
   ↓
2. Phân tích       tìm các "cụm số lượng": số + lượng từ + từ bổ nghĩa + danh từ
                   (四 · 个 · 绿 · 苹果), nhận biết phủ định, số ước lượng…
   ↓
3. Chấm nội dung   câu trả lời có nói đúng điều câu hỏi cần không? Sai → tối đa 20 điểm
   ↓
4. Bắt lỗi         mỗi lỗi ngôn ngữ bị trừ điểm, kèm nhận xét tiếng Việt và cách sửa
   ↓
5. Kết quả         điểm 0–100, nhận xét, câu đã sửa, cờ "cần giáo viên xem lại"
```

Nguyên tắc quan trọng nhất: **chính xác trước, đầy đủ sau.** Khi không chắc (gặp từ lạ, một từ có nhiều cách dùng), luật sẽ im lặng. Bỏ sót một lỗi thì ít hại; báo sai một câu đúng sẽ dạy người học điều sai.

## Viết câu hỏi

Mỗi câu hỏi là một file JSON trong [questions/zh/](questions/zh/). Thêm câu hỏi mới không cần sửa code.

### Loại `count`: hỏi số lượng

```json
{
  "id": "zh-count-green-apples",
  "lang": "zh",
  "type": "count",
  "title": "Đếm táo xanh",
  "prompt": "图片里有几个绿苹果？",
  "promptVi": "Trong hình có mấy quả táo xanh?",
  "picture": "🍏🍏🍏🍏🍎🍎",
  "expected": { "number": 4, "noun": "苹果", "colors": ["绿", "青"], "sentence": "图片里有四个绿苹果。" },
  "options": { "requireFullSentence": false, "allowArabicDigits": true, "wrongContentScore": 20 }
}
```

| Trường | Ý nghĩa |
|---|---|
| `expected.number` | Số lượng đúng |
| `expected.noun` | Danh từ được đếm; nên có trong [bảng danh từ](src/lang/zh/data/nouns.json) để kiểm tra được lượng từ |
| `expected.colors` | Các từ chỉ màu được chấp nhận (không bắt buộc) |
| `expected.sentence` | Câu trả lời mẫu để gợi ý cho người học (không bắt buộc) |
| `options.requireFullSentence` | Bắt trả lời thành câu có 有/是 (mặc định: không) |
| `options.allowArabicDigits` | Chấp nhận chữ số 4 thay cho 四 (mặc định: có) |
| `options.wrongContentScore` | Điểm tối đa khi sai nội dung (mặc định: 20) |

### Loại `model`: so với đáp án mẫu

```json
{
  "id": "zh-model-what-is-this",
  "lang": "zh",
  "type": "model",
  "prompt": "这是什么？",
  "answers": ["[这|这个]是(一个)苹果。", "(是)(一个)苹果。", { "text": "苹果吧。", "score": 90 }]
}
```

Cú pháp viết gọn nhiều đáp án (chỉ dùng ngoặc ASCII):

| Cú pháp | Nghĩa | Ví dụ |
|---|---|---|
| `[a\|b]` | chọn một trong các phương án | `[这\|那]是苹果` → 这是苹果, 那是苹果 |
| `(x)` | phần có thể bỏ | `(我)是越南人` → 我是越南人, 是越南人 |
| lồng nhau | được | `[这(个)\|那]是苹果` → 这个是苹果, 这是苹果, 那是苹果 |

Khi so khớp, bộ chấm bỏ qua dấu câu, thán từ đầu câu (嗯，…) và trợ từ cuối câu (…啊). Nó chấp nhận lỗi gõ nhầm chữ đồng âm (−5) và thiếu/thừa một vài hư từ như 是, 的, 了 (−15). Nó **không bao giờ** bỏ qua chữ làm đổi nghĩa: 不, 没, con số, 这/那…

### Ví dụ đi kèm câu hỏi

Trường `examples` liệt kê các câu trả lời mẫu cùng điểm mong đợi:

```json
"examples": [
  { "answer": "有四苹果。", "score": 80, "issues": ["missing_measure_word"] },
  { "answer": "有十四个绿苹果。", "score": 20, "note": "Sai số lượng, dù có chứa chữ 四" }
]
```

Mỗi ví dụ vừa là nút "Thử nhanh" trên trang demo, vừa là **một test tự động**. Khi sửa luật, nếu một ví dụ cho điểm khác đi thì `npm test` sẽ báo ngay. Ví dụ 100 điểm mà không ghi `issues` thì phải không có lỗi nào.

## Luật bắt lỗi và mức trừ điểm mặc định

| Mã | Lỗi | Sai → Đúng | Trừ |
|---|---|---|---|
| `missing_measure_word` | Thiếu lượng từ | 四苹果 → 四个苹果 | 20 |
| `wrong_measure_word` | Sai lượng từ | 四本苹果 → 四个苹果 | 20 |
| `er_liang` | Dùng 二 trước lượng từ | 二个 → 两个, 二点 → 两点 | 10 |
| `liang_misuse` | Dùng 两 sai chỗ | 十两 → 十二, 第两 → 第二 | 10 |
| `modifier_order` | Tính từ/màu đặt sau danh từ (lỗi do tiếng Việt) | 苹果绿 → 绿苹果 | 20 |
| `bu_you` | Phủ định 有 bằng 不 | 不有 → 没有 | 20 |
| `homophone_char` | Gõ nhầm chữ đồng âm | 平果 → 苹果 | 5 |
| `missing_word` / `extra_word` | Thiếu/thừa hư từ (loại `model`) | 我越南人 → 我是越南人 | 15 |
| `not_full_sentence` | Chưa thành câu (khi câu hỏi yêu cầu) | 四个绿苹果 → 有四个绿苹果 | 20 |
| `arabic_digits` | Dùng chữ số (khi câu hỏi yêu cầu chữ Hán) | 4个 → 四个 | 5 |
| `traditional_converted` | Chữ phồn thể (chỉ ghi chú) | 蘋果 → 苹果 | 0 |

Mỗi câu hỏi có thể đổi mức trừ qua trường `penalties`, ví dụ `"penalties": { "missing_measure_word": 30 }`.

## Cấu trúc thư mục

```
src/
  core/            phần dùng chung cho mọi ngôn ngữ: kiểu dữ liệu, cú pháp đáp án, so khớp, kiểm tra câu hỏi
  lang/zh/         gói tiếng Trung
    data/          từ vựng dạng JSON (lượng từ, danh từ, màu/tính từ, từ chứa chữ số nhưng không phải số)
    analyze.ts     phân tích câu (cụm số lượng)
    rules.ts       các luật bắt lỗi
    count.ts       bộ chấm loại count
    model.ts       bộ chấm loại model
    messages.ts    lời nhận xét tiếng Việt
  grade.ts         điểm vào: chọn gói ngôn ngữ theo câu hỏi
questions/zh/      câu hỏi mẫu
demo/              trang demo
tests/             test (Vitest), kể cả test giao diện demo (happy-dom)
docs/design.md     thiết kế và các quyết định
```

## Giới hạn hiện tại

- Mới có 2 loại câu hỏi (`count`, `model`) và chỉ có tiếng Trung.
- Từ vựng là danh sách khởi đầu (123 danh từ, 100 lượng từ, mức HSK 1–3) và **chưa được giáo viên duyệt**. Lượng từ có khác biệt vùng miền (ví dụ 一只苹果 ở Thượng Hải) chưa được xử lý.
- Câu hỏi mở (viết đoạn văn, hội thoại tự do) nằm ngoài khả năng của cách chấm bằng luật.
- Chưa hỗ trợ trả lời bằng pinyin hoặc giọng nói.

Hướng phát triển tiếp theo nằm ở cuối [docs/design.md](docs/design.md).
