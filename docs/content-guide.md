# Hướng dẫn soạn và duyệt nội dung khóa học

Nội dung khóa học nằm trong `packages/course/data/` và theo giấy phép CC BY-SA 4.0. Mọi nội dung hiện là **bản nháp do Claude soạn**; giáo viên duyệt qua bảng tính (mục 5).

## 1. Các file

| File | Nội dung | Ai sửa |
|---|---|---|
| `data/hsk/vocabulary.json`, `grammar.json`, `characters.json` | Danh sách chính thức của đề cương thi HSK 2025, cấp 1–3 | Sinh tự động (`npm run data:build`), không sửa tay |
| `data/curriculum.json` | Bài nào dạy những từ (theo số thứ tự trong đề cương) và điểm ngữ pháp nào | Người soạn, giáo viên duyệt |
| `data/lessons/hsk<N>/<NN>.json` | Nội dung một bài: nghĩa, ví dụ, giải thích ngữ pháp, bài tập | Người soạn, giáo viên duyệt |
| `data/names.json` | Tên riêng được dùng trong câu mà không cần dạy (大卫, 越南…) | Người soạn |
| `data/levels.json` | Cấp nào đã soạn xong (`complete`): khi đó test bắt buộc phủ đủ từ và ngữ pháp | Người soạn |

## 2. Quy trình soạn một bài

1. Xem bài cần dạy gì và được dùng những từ nào: `npm run content:brief -w @c-learn-write/course -- hsk1-05`.
2. Viết file `data/lessons/hsk1/05.json` theo mẫu của bài 1 (`hsk1/01.json`). Không cần viết pinyin của câu.
3. Điền pinyin và định dạng file: `npm run content:fill -w @c-learn-write/course -- hsk1-05`.
4. Kiểm tra riêng bài đó: `CONTENT_FILTER=hsk1-05 npx vitest run --project course` (ở thư mục gốc). Sửa đến khi không còn lỗi, rồi chạy `npm run check`.

## 3. Quy ước nội dung

**Kiểm soát từ vựng (bắt buộc, test tự kiểm tra).** Mọi câu tiếng Trung trong một bài (ví dụ, bài tập) chỉ được dùng các từ của bài đó và các bài trước, cộng với tên riêng trong `names.json`. Muốn dùng một từ chưa học thì phải đổi câu.

**Từ (`words`).** Mỗi từ của bài có:
- `meaningsVi`: nghĩa ngắn gọn, nghĩa thông dụng nhất đứng trước; nhiều nghĩa khác nhau thì tách thành nhiều mục.
- `noteVi` (khi có ích): cách dùng, chỗ khác tiếng Việt, âm Hán Việt dễ gây hiểu nhầm.
- `examples`: ít nhất một câu có chứa từ đó, tự nhiên, ngắn, có ích cho người học; `vi` là bản dịch tự nhiên.

**Ngữ pháp (`grammar`).** Mỗi điểm có `titleVi`, `summaryVi` (một câu), `explanationVi` (2–4 đoạn ngắn, viết cho người mới học, so sánh với tiếng Việt khi có ích), `patterns`, `examples` (2–4 câu), và `mistakes` (lỗi hay gặp, ưu tiên lỗi do thói quen tiếng Việt). Trong giải thích, chữ Hán đặt trong 「」, chỗ cần nhấn mạnh viết `**…**`. Câu trong `mistakes.right` phải đúng và qua kiểm soát từ vựng; `wrong` phải thật sự sai. `issue` ghi mã lỗi của bộ chấm nếu bộ chấm bắt được lỗi đó. Với điểm ngữ pháp mang tính khái niệm (kiểu câu, thành phần câu), giải thích ngắn và lấy ví dụ từ các bài đã học.

**Bài tập (`exercises`).** Mã `hsk1-05-e01`, `e02`… Mỗi điểm ngữ pháp của bài cần **ít nhất 3 bài tập** ghi `grammar: [số]`. Nên có 15–25 bài tập mỗi bài, đủ các dạng:

| Dạng | Trường | Chấm |
|---|---|---|
| `choice` | `promptVi`, `zh` (tùy chọn, dùng ＿ cho chỗ trống), `options`, `answer` (chỉ số), `explainVi` | So đáp án |
| `fill` | `before`, `after` (kết thúc bằng 。！？), `answers`, `options` (tùy chọn), `vi` | So đáp án sau khi chuẩn hóa |
| `order` | `vi`, `tiles`, `answers` (các thứ tự được chấp nhận, không có dấu câu) | So thứ tự; sai thì bộ chấm giải thích nếu có luật |
| `translate` | `vi`, `answers` (cú pháp `[a\|b](x)` của bộ chấm), `examples` | Bộ chấm loại `model` |
| `question` | `question`: câu hỏi của bộ chấm (`count`, `location`, `model`) không có `id`, `lang` | Bộ chấm |
| `match` | `promptVi`, `pairs` (chữ Hán ↔ nghĩa) | So cặp |

Với `translate` và `question`, phải liệt kê đủ các cách nói đúng phổ biến trong `answers`, và thêm `examples` gồm vài câu đúng, vài câu sai kèm điểm mong đợi. Mỗi ví dụ là một test: test kiểm tra bộ chấm cho đúng điểm đó.

**Câu đúng không bị bắt lỗi.** Test chạy các luật của bộ chấm trên mọi câu đúng của khóa học (ví dụ, `mistakes.right`, đáp án). Nếu một câu đúng bị báo lỗi, đó là lỗi của luật: báo lại và sửa luật (chính xác trước, đầy đủ sau).

**Bản quyền.** Không chép câu ví dụ chính thức của đề cương hay của giáo trình có bản quyền. Tự viết câu mới.

## 4. Trạng thái duyệt

Mỗi từ, điểm ngữ pháp (và tùy chọn mỗi bài tập) có `review`:

```json
{ "status": "draft" }
{ "status": "approved", "by": "GV Lan", "date": "2026-12-01", "hash": "1a2b3c4d" }
```

- `draft`: chưa duyệt, app hiện nhãn "Chưa duyệt".
- `approved`: giáo viên đã duyệt. `hash` là mã của nội dung lúc duyệt; nếu nội dung bị sửa sau đó thì app coi như chưa duyệt.
- `changes_requested`: giáo viên yêu cầu sửa; `note` ghi góp ý.

## 5. Giáo viên duyệt bằng bảng tính

Giáo viên không cần biết JSON hay GitHub.

1. Người phụ trách xuất các bài cần duyệt ra bảng tính:
   `npm run review:export -w @c-learn-write/course -- duyet-hsk1.csv hsk1` (cả HSK1), hoặc `… -- duyet-bai3.csv hsk1-03` (một bài).
2. Giáo viên mở file bằng Excel hoặc Google Sheets. Mỗi dòng là một từ, một điểm ngữ pháp hoặc một bài tập, gồm chữ Hán, pinyin, nghĩa, ghi chú, âm Hán Việt, ví dụ (chữ Hán — pinyin — bản dịch), lỗi hay gặp.
3. Với mỗi dòng đã xem, giáo viên điền:
   - **Kết quả duyệt**: `đạt` hoặc `cần sửa`;
   - **Người duyệt**: tên hoặc chữ viết tắt;
   - **Góp ý**: bắt buộc khi `cần sửa` (sửa thế nào, vì sao).
   Không sửa các cột khác, nhất là cột **Mã** và **Mã nội dung**. Lưu lại dưới dạng CSV (UTF-8).
4. Người phụ trách nhập kết quả: `npm run review:import -w @c-learn-write/course -- duyet-hsk1.csv`. Nếu có dòng sai (giá trị lạ, thiếu góp ý, hoặc nội dung đã bị sửa sau khi xuất), lệnh báo lỗi và **không ghi gì**.
5. Các mục `cần sửa` được sửa theo góp ý, rồi xuất lại để giáo viên duyệt lần nữa. Khi một mục đã `đạt` bị sửa nội dung, app tự coi nó là "Chưa duyệt" cho tới khi được duyệt lại.
