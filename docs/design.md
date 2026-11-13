# Thiết kế bộ chấm

Tài liệu này ghi lại các quyết định, kiến trúc và thuật toán của prototype, để người tiếp tục (bạn, hoặc một phiên Claude sau) hiểu vì sao code được viết như vậy.

## Quyết định của chủ dự án (2026-11-13)

| Vấn đề | Quyết định | Lý do chính |
|---|---|---|
| Có dùng LLM/AI không? | **Không.** Chấm hoàn toàn bằng luật | Yêu cầu gốc của dự án |
| Ngôn ngữ lập trình | **TypeScript** | Bộ chấm chạy ngay trong app web/điện thoại, chấm tức thì, dùng được khi offline, không cần server |
| Ngôn ngữ của lời nhận xét | **Tiếng Việt** | Người học là người Việt; làm trước các luật bắt lỗi do thói quen tiếng Việt |
| Cách thử prototype | **Trang web demo** + test tự động | Dễ thử, dễ đưa giáo viên xem |
| Phạm vi | Loại câu hỏi **đếm số lượng** + **đáp án mẫu** | Hỏi nơi chốn và trả lời bằng pinyin để sau |

## Kiến trúc

```
src/core/      không phụ thuộc ngôn ngữ: kiểu dữ liệu, cú pháp [a|b](x), thuật toán so khớp,
               áp dụng chỗ sửa, kiểm tra cấu hình câu hỏi
src/lang/zh/   gói tiếng Trung: chuẩn hóa, đọc số, từ vựng, phân tích câu, luật, bộ chấm
src/grade.ts   chọn gói ngôn ngữ theo question.lang
```

Câu hỏi là **dữ liệu** (JSON), không phải code: thêm câu hỏi mới không cần sửa code. `switch` theo `question.type` chọn bộ chấm của từng loại câu hỏi.

**Thêm tiếng Anh sau này**: tạo `src/lang/en/` có hàm `gradeEn(question, answer)` trả về cùng kiểu `GradeResult`, thêm `'en'` vào `LangCode` và một nhánh `case 'en'` trong `src/grade.ts`. Phần `core` (cú pháp đáp án, so khớp, áp dụng chỗ sửa, tính điểm) dùng lại nguyên vẹn.

Mọi thứ đều tất định (deterministic): cùng một câu trả lời luôn cho cùng một kết quả trên mọi máy. Vì vậy bộ phân tích tiếng Trung dựa vào **từ vựng của dự án** chứ không dùng bộ tách từ của trình duyệt (`Intl.Segmenter`), vì bộ tách từ đó có thể khác nhau giữa các trình duyệt.

## Nguyên tắc: chính xác trước, đầy đủ sau

Mỗi luật chỉ báo lỗi khi chắc chắn. Ví dụ:

- Gặp danh từ lạ (không có trong từ vựng), luật lượng từ sẽ im lặng.
- 二 trước 月/号/楼/年级/斤 vẫn đúng (二月, 二楼…), nên luật 二→两 không báo lỗi.
- 不有 trong 无所不有, 不有趣 không phải lỗi.
- 苹果是绿的 và 苹果绿了 là vị ngữ, không phải lỗi trật tự từ.

Khi không chắc về **nội dung**, bộ chấm đặt cờ `needsReview` (cần giáo viên xem lại) thay vì đoán.

## Phân tích câu tiếng Trung

Thay vì một bộ phân tích cú pháp tổng quát (rất dễ hỏng khi câu có lỗi của người học), [analyze.ts](../src/lang/zh/analyze.ts) chỉ tìm **cụm số lượng**, cấu trúc mang dữ kiện của câu trả lời:

```
số      [lượng từ]  [từ bổ nghĩa]  [danh từ]  [từ bổ nghĩa đặt sai chỗ]
四        个          绿             苹果
四        个                         苹果        绿      ← lỗi trật tự từ
```

- **Số**: chữ số Ả Rập hoặc chữ Hán (四, 十四, 一百零五, 两千三, 四五 = "4 hoặc 5"). Các từ chỉ trông giống số (一起, 一共, 星期四, 十分好, 看一看…) bị loại nhờ danh sách [non-numbers.json](../src/lang/zh/data/non-numbers.json); số thứ tự (第四) cũng bị loại.
- **Lượng từ**: phân loại theo [measure-words.json](../src/lang/zh/data/measure-words.json): lượng từ cá thể (phải hợp với danh từ), chung (种), đồ chứa (杯), thời gian, lịch, tiền, đo lường, số thứ tự.
- **Danh từ**: ưu tiên từ dài nhất trong từ vựng (苹果树 thắng 苹果). Một từ đồng âm với danh từ mong đợi (平果 ↔ 苹果) được nhận là lỗi gõ, **trừ khi** chính nó là một danh từ khác có thật.
- **Phủ định**: 没(有), 不是, 不止, 不到… đứng ngay trước số trong cùng mệnh đề.

## Chấm loại `count`

1. Xếp mỗi cụm số lượng vào một trong các nhóm: nói về đối tượng được hỏi; nói về màu khác (红苹果); nói về danh từ khác (梨); hoặc không phải phép đếm (四点, 四岁, 四种). Màu được tính cả khi nằm ở vị ngữ (四个是绿的).
2. Xác định con số người học khẳng định:
   - Các cụm phủ định bị bỏ qua (不是五个，是四个 → 4).
   - Nếu các con số mâu thuẫn, ưu tiên cụm có nói rõ màu được hỏi (有六个苹果，四个是绿的 → 4).
   - Số ước lượng (四五个, 十几个) hoặc hai con số khác nhau (四个或者五个) thì sai nội dung.
   - 没有绿苹果 (không có số) nghĩa là 0.
3. **Cổng chặn nội dung**: sai nội dung thì điểm tối đa là `wrongContentScore` (mặc định 20). Không có câu trả lời thì 0 điểm.
4. Đúng nội dung: 100 trừ tổng mức phạt của các lỗi ngôn ngữ. Áp dụng tất cả các chỗ sửa của luật để tạo câu đã sửa.

## Chấm loại `model`

1. Mở rộng các mẫu `[a|b](x)` thành danh sách đáp án.
2. Nếu câu trả lời **trùng y hệt** một đáp án mẫu (bỏ qua dấu câu, thán từ đầu câu, trợ từ cuối câu) thì nhận điểm của đáp án đó, không chạy luật. Đáp án mẫu do giáo viên viết được tin tưởng tuyệt đối.
3. Nếu không trùng: chạy các luật, áp dụng chỗ sửa của luật rồi so lại. Ví dụ 这是一苹果 được sửa thành 这是一个苹果, khớp đáp án, bị trừ 20 vì thiếu lượng từ.
4. So khớp bằng **căn chỉnh từng ký tự** có trọng số ([align.ts](../src/core/align.ts)). Mỗi số được coi là một đơn vị (四 = 4 = `#4`). Những gì được chấp nhận:
   - Chữ đồng âm (cùng pinyin, bỏ qua thanh điệu): −5 mỗi chữ, tối đa khoảng 1/3 độ dài câu.
   - Thiếu/thừa hư từ 是 的 了 很 也 都 就 还 个 呢 吧 啊 呀: −15 mỗi từ, tối đa 1 lần (câu ≤ 4 đơn vị) hoặc 2 lần (câu dài hơn).
   - Không bao giờ chấp nhận chỗ khác nhau ở 不 没 别 无 非 未 吗 否, ở con số, hay 这/那.
5. Nếu cả câu không khớp, thử **từng mệnh đề**. Câu có thêm thông tin (我是越南人，我住在河内) được chấp nhận nhưng gắn cờ cần xem lại, vì phần thêm chưa được kiểm tra nội dung.
6. Không khớp gì thì 0 điểm, kèm đáp án gần nhất làm gợi ý. Gắn cờ cần xem lại nếu chỉ khác đúng một chữ không làm đổi nghĩa (这是芒果 so với 这是苹果).

## Dữ liệu cần giáo viên duyệt

Danh sách khởi đầu do Claude soạn, **chưa được giáo viên kiểm tra**:

- [ ] [nouns.json](../src/lang/zh/data/nouns.json): 123 danh từ và các lượng từ được chấp nhận; lượng từ đầu tiên là lượng từ được gợi ý khi sửa. Cần xem lại các trường hợp có tranh luận: 电脑 có dùng được 个 không? 椅子 có dùng được 张 không? 苹果 có dùng được 颗 không?
- [ ] [measure-words.json](../src/lang/zh/data/measure-words.json): loại của từng lượng từ và danh sách `erOk` (những chỗ 二 vẫn đúng).
- [ ] [modifiers.json](../src/lang/zh/data/modifiers.json): màu và tính từ dùng cho luật trật tự từ.
- [ ] [non-numbers.json](../src/lang/zh/data/non-numbers.json): các từ chứa chữ số nhưng không phải số.
- [ ] [messages.ts](../src/lang/zh/messages.ts): lời nhận xét tiếng Việt.
- [ ] Mức trừ điểm mặc định trong [issues.ts](../src/lang/zh/issues.ts).
- [ ] Các câu hỏi mẫu trong [questions/zh/](../questions/zh/) và điểm mong đợi của từng ví dụ.

## Kiểm thử

- `npm test` chạy hơn 200 test: đọc số, chuẩn hóa, từ vựng, phân tích câu, từng luật (gồm cả các ca **không được** báo lỗi), hai bộ chấm, tất cả ví dụ của các câu hỏi mẫu, và giao diện demo (happy-dom).
- `npm run check` = kiểm tra kiểu TypeScript + test.
- Tốc độ: khoảng 0,1 ms mỗi câu trả lời (sau lần chấm đầu tiên, vốn phải nạp từ điển pinyin).

## Hướng phát triển

1. Nhờ giáo viên duyệt dữ liệu ở danh sách trên; bổ sung danh từ theo giáo trình.
2. Ghi lại các câu trả lời thật cùng kết quả chấm. Những câu có cờ `needsReview` được giáo viên xem rồi bổ sung vào đáp án mẫu hoặc luật.
3. Thêm loại câu hỏi "hỏi nơi chốn" (luật 我吃饭在家 → 我在家吃饭, một lỗi rất hay gặp ở người Việt).
4. Cho phép trả lời bằng pinyin và chấm thanh điệu.
5. Gói tiếng Anh (`src/lang/en`) cho app tiếng Anh.
