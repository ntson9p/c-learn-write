# Bộ chấm (`@c-learn-write/grader`)

Bộ chấm câu trả lời tự luận ngắn cho người học tiếng Trung, **không dùng LLM/AI**: chấm bằng luật ngôn ngữ, chạy hoàn toàn trên máy (trình duyệt hoặc Node.js), nhận xét bằng tiếng Việt.

> **Trạng thái: prototype.** Bảng lượng từ và các luật cần được giáo viên tiếng Trung duyệt trước khi dùng thật (xem [docs/design.md](../../docs/design.md#dữ-liệu-cần-giáo-viên-duyệt)).

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

Với câu hỏi nơi chốn, bộ chấm bắt các lỗi trật tự từ rất hay gặp ở người Việt:

| Câu hỏi | Câu trả lời | Điểm | Nhận xét |
|---|---|---|---|
| 你在哪儿吃饭？ | 我在家吃饭。 | 100 | Hoàn toàn chính xác |
| 你在哪儿吃饭？ | 我吃饭在家。 | 80 | 「在 + nơi chốn」 đứng trước động từ: 「我在家吃饭」 |
| 书在哪儿？ | 书在里书包。 | 80 | Phương vị từ đứng sau danh từ: 「书包里」 |
| 书在哪儿？ | 书在书包。 | 80 | Thiếu phương vị từ: 「书包里」 |
| 书在哪儿？ | 书在书包上。 | 20 | Sai vị trí: sách ở trong cặp, không phải trên cặp |
| 你住在哪儿？ | 我住在河内里。 | 90 | Tên thành phố không thêm 「里」 |

## Chạy thử

Yêu cầu: Node.js 22.12 trở lên (đã thử với Node 22.23 và 24.21).

Repo là một monorepo npm workspaces: bộ chấm nằm ở `packages/grader`, web app ở `apps/web` (xem [docs/plan.md](../../docs/plan.md)).

```sh
npm ci
npm run dev       # web app: mở địa chỉ Vite in ra (thêm -- --host để mở từ điện thoại)
npm run demo      # trang demo của bộ chấm: http://localhost:5173
npm run check     # kiểm tra kiểu TypeScript + toàn bộ test
npm run build     # build web app (PWA) vào apps/web/dist
npm run e2e       # build rồi chạy test đầu-cuối bằng Playwright (Chromium)
```

Trên trang demo (hoặc trang "Chấm thử" trong app), chọn một câu hỏi, gõ câu trả lời hoặc bấm một câu trong mục "Thử nhanh". Kết quả gồm điểm, lời nhận xét cho từng lỗi (kèm số điểm bị trừ), câu đã sửa, đáp án tham khảo, và cờ "Cần giáo viên xem lại" khi bộ chấm không chắc chắn.

## Dùng trong code

```ts
import { grade, type Question } from '@c-learn-write/grader';
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
                   (四 · 个 · 绿 · 苹果) và các "cụm nơi chốn": 在 + nơi chốn + phương vị từ
                   (在 · 书包 · 里); nhận biết phủ định, số ước lượng, 在 nghĩa "đang"…
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

### Loại `location`: hỏi nơi chốn

```json
{
  "id": "zh-location-book",
  "lang": "zh",
  "type": "location",
  "prompt": "书在哪儿？",
  "promptVi": "Quyển sách ở đâu? (trong hình: quyển sách ở trong cặp sách)",
  "expected": { "places": ["书包", "包"], "localizer": "里", "sentence": "书在书包里。" }
}
```

| Trường | Ý nghĩa |
|---|---|
| `expected.places` | Các nơi được chấp nhận (từ đồng nghĩa liệt kê cùng nhau). **Bỏ trường này** với câu hỏi về bản thân người học (你在哪儿吃饭？): khi đó nơi nào cũng đúng, chỉ chấm ngôn ngữ |
| `expected.localizer` | Phương vị từ bắt buộc, ví dụ `里` (chấp nhận cả 里面, 里边). Đây là một phần của nội dung: 书包上 khác 书包里. Nếu người học quên phương vị từ (书在书包) thì chỉ bị tính là lỗi ngôn ngữ |
| `expected.sentence` | Câu trả lời mẫu để gợi ý (không bắt buộc) |
| `options.wrongContentScore` | Điểm tối đa khi sai nội dung (mặc định: 20) |

Nơi chốn nên có trong [places.json](src/lang/zh/data/places.json), vì ở đó ghi rõ từ nào là tên riêng (中国, không thêm 里), nơi chốn (家, 里 tùy ý) hay đồ vật (桌子, bắt buộc có phương vị từ). Với câu hỏi về bản thân, tên địa điểm lạ (một con phố, một ngôi trường) vẫn được chấp nhận nhưng gắn cờ "Cần giáo viên xem lại".

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
| `place_order` | Cụm 在 + nơi chốn đặt sau động từ (lỗi do tiếng Việt) | 我吃饭在家 → 我在家吃饭; 放书在桌子上 → 把书放在桌子上 | 20 |
| `localizer_order` | Phương vị từ đặt trước danh từ (lỗi do tiếng Việt) | 在上桌子 → 在桌子上 | 20 |
| `missing_localizer` | Đồ vật thiếu phương vị từ | 在桌子 → 在桌子上 | 20 |
| `extra_localizer` | Thêm 里 sau tên nước, tên thành phố | 在中国里 → 在中国 | 10 |
| `homophone_char` | Gõ nhầm chữ đồng âm | 平果 → 苹果, 再家 → 在家 | 5 |
| `missing_word` / `extra_word` | Thiếu/thừa hư từ (loại `model`) | 我越南人 → 我是越南人 | 15 |
| `not_full_sentence` | Chưa thành câu (khi câu hỏi yêu cầu) | 四个绿苹果 → 有四个绿苹果 | 20 |
| `arabic_digits` | Dùng chữ số (khi câu hỏi yêu cầu chữ Hán) | 4个 → 四个 | 5 |
| `traditional_converted` | Chữ phồn thể (chỉ ghi chú) | 蘋果 → 苹果 | 0 |

Mỗi câu hỏi có thể đổi mức trừ qua trường `penalties`, ví dụ `"penalties": { "missing_measure_word": 30 }`.

## Cấu trúc thư mục

```
packages/grader/   bộ chấm (@c-learn-write/grader)
  src/core/        phần dùng chung cho mọi ngôn ngữ: kiểu dữ liệu, cú pháp đáp án, so khớp, kiểm tra câu hỏi
  src/lang/zh/     gói tiếng Trung: chuẩn hóa, đọc số, từ vựng JSON (data/), phân tích câu, luật, các bộ chấm,
                   lời nhận xét tiếng Việt
  src/grade.ts     điểm vào: chọn gói ngôn ngữ theo câu hỏi
  questions/zh/    câu hỏi mẫu (mỗi ví dụ là một test)
  demo/            trang demo của bộ chấm
  tests/           test (Vitest)
apps/web/          web app PWA (Preact + Vite), dùng bộ chấm như một thư viện
docs/              plan.md (kế hoạch), handoff.md (bàn giao), design.md (thiết kế bộ chấm)
```

## Giới hạn hiện tại

- Mới có 3 loại câu hỏi (`count`, `model`, `location`) và chỉ có tiếng Trung.
- Từ vựng là danh sách khởi đầu (123 danh từ, 100 lượng từ, 116 từ chỉ nơi chốn, 31 phương vị từ, 114 động từ, mức HSK 1–3) và **chưa được giáo viên duyệt**. Lượng từ có khác biệt vùng miền (ví dụ 一只苹果 ở Thượng Hải) chưa được xử lý.
- Luật trật tự nơi chốn sẽ im lặng khi câu có động từ chuyển động (我去学习在图书馆), vì cách sửa đúng (我去图书馆学习) khác hẳn các trường hợp còn lại.
- Câu hỏi mở (viết đoạn văn, hội thoại tự do) nằm ngoài khả năng của cách chấm bằng luật.
- Chưa hỗ trợ trả lời bằng pinyin hoặc giọng nói.

Hướng phát triển tiếp theo nằm ở cuối [docs/design.md](../../docs/design.md).
