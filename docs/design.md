# Thiết kế bộ chấm

Tài liệu này ghi lại các quyết định, kiến trúc và thuật toán của prototype, để người tiếp tục (bạn, hoặc một phiên Claude sau) hiểu vì sao code được viết như vậy.

## Quyết định của chủ dự án (2026-11-13)

| Vấn đề | Quyết định | Lý do chính |
|---|---|---|
| Có dùng LLM/AI không? | **Không.** Chấm hoàn toàn bằng luật | Yêu cầu gốc của dự án |
| Ngôn ngữ lập trình | **TypeScript** | Bộ chấm chạy ngay trong app web/điện thoại, chấm tức thì, dùng được khi offline, không cần server |
| Ngôn ngữ của lời nhận xét | **Tiếng Việt** | Người học là người Việt; làm trước các luật bắt lỗi do thói quen tiếng Việt |
| Cách thử prototype | **Trang web demo** + test tự động | Dễ thử, dễ đưa giáo viên xem |
| Phạm vi | Loại câu hỏi **đếm số lượng** + **đáp án mẫu**; ngay sau đó thêm **hỏi nơi chốn** | Trả lời bằng pinyin để sau |

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
- 住在河内, 放在桌子上 (động từ + 在) là cách nói đúng, nên luật trật tự nơi chốn im lặng.
- 椅子。 chỉ là một cái ghế, trừ khi đó là câu trả lời cho câu hỏi 在哪儿.

Khi không chắc về **nội dung**, bộ chấm đặt cờ `needsReview` (cần giáo viên xem lại) thay vì đoán.

## Phân tích câu tiếng Trung

Thay vì một bộ phân tích cú pháp tổng quát (rất dễ hỏng khi câu có lỗi của người học), [analyze.ts](../packages/grader/src/lang/zh/analyze.ts) chỉ tìm **cụm số lượng**, cấu trúc mang dữ kiện của câu trả lời:

```
số      [lượng từ]  [từ bổ nghĩa]  [danh từ]  [từ bổ nghĩa đặt sai chỗ]
四        个          绿             苹果
四        个                         苹果        绿      ← lỗi trật tự từ
```

- **Số**: chữ số Ả Rập hoặc chữ Hán (四, 十四, 一百零五, 两千三, 四五 = "4 hoặc 5"). Các từ chỉ trông giống số (一起, 一共, 星期四, 十分好, 看一看…) bị loại nhờ danh sách [non-numbers.json](../packages/grader/src/lang/zh/data/non-numbers.json); số thứ tự (第四) cũng bị loại.
- **Lượng từ**: phân loại theo [measure-words.json](../packages/grader/src/lang/zh/data/measure-words.json): lượng từ cá thể (phải hợp với danh từ), chung (种), đồ chứa (杯), thời gian, lịch, tiền, đo lường, số thứ tự.
- **Danh từ**: ưu tiên từ dài nhất trong từ vựng (苹果树 thắng 苹果). Một từ đồng âm với danh từ mong đợi (平果 ↔ 苹果) được nhận là lỗi gõ, **trừ khi** chính nó là một danh từ khác có thật.
- **Phủ định**: 没(有), 不是, 不止, 不到… đứng ngay trước số trong cùng mệnh đề.

## Phân tích nơi chốn

[places.ts](../packages/grader/src/lang/zh/places.ts) tìm các **cụm nơi chốn**:

```
在  nơi chốn      [的] [phương vị từ]     在 家 里 · 在 桌子 上 · 在 桌子 的 上面
在  phương vị từ  nơi chốn                在 上 桌子   ← lỗi: phương vị từ đặt trước (kiểu "trên bàn")
cụm 的 cụm                                在 桌子上 的 书包里
```

- **Từ vựng** ([places.json](../packages/grader/src/lang/zh/data/places.json)) chia ba loại: tên riêng (中国, 河内: không thêm 里), nơi chốn (家, 学校: 里 tùy ý), đồ vật (桌子, 书包: bắt buộc có phương vị từ). Phương vị từ được xếp nhóm theo nghĩa (nhóm 上 gồm 上/上面/上边/上头…).
- **Không phải nơi chốn**: 在 + động từ là thể tiếp diễn (我在吃饭, 我在上课); 在 + thời gian (在晚上, 在五月); chữ 在 nằm trong 现在, 实在…
- **Không bị coi là phương vị từ đặt ngược**: các từ có thật bắt đầu bằng phương vị từ (上海, 上课, 上车, 外地…).
- Ngoài ra còn nhận ra: sở hữu (在我的房间), từ hạn định (在一个小城市, 在这家饭馆), 再 gõ nhầm cho 在 (再家), động từ nhận nơi chốn trực tiếp (住河内, 回家), câu trả lời ngắn (书包里。, 桌子上有一本书).
- Tên lạ đứng sau 在 được nhận là nơi chốn khi kết thúc bằng một từ chỉ nơi chốn (阮廌高中, 阿明家). Nếu không, nó được ghi là "không rõ".
- Một đồ vật đứng một mình (椅子。) chỉ được coi là nơi chốn khi trả lời câu hỏi 在哪儿.

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
4. So khớp bằng **căn chỉnh từng ký tự** có trọng số ([align.ts](../packages/grader/src/core/align.ts)). Mỗi số được coi là một đơn vị (四 = 4 = `#4`). Những gì được chấp nhận:
   - Chữ đồng âm (cùng pinyin, bỏ qua thanh điệu): −5 mỗi chữ, tối đa khoảng 1/3 độ dài câu.
   - Thiếu/thừa hư từ 是 的 了 很 也 都 就 还 个 呢 吧 啊 呀: −15 mỗi từ, tối đa 1 lần (câu ≤ 4 đơn vị) hoặc 2 lần (câu dài hơn).
   - Không bao giờ chấp nhận chỗ khác nhau ở 不 没 别 无 非 未 吗 否, ở con số, hay 这/那.
5. Nếu cả câu không khớp, thử **từng mệnh đề**. Câu có thêm thông tin (我是越南人，我住在河内) được chấp nhận nhưng gắn cờ cần xem lại, vì phần thêm chưa được kiểm tra nội dung.
6. Không khớp gì thì 0 điểm, kèm đáp án gần nhất làm gợi ý. Gắn cờ cần xem lại nếu chỉ khác đúng một chữ không làm đổi nghĩa (这是芒果 so với 这是苹果).

## Chấm loại `location`

1. **Câu hỏi theo hình** (có `expected.places`). Mỗi cụm nơi chốn được xếp vào một trong ba nhóm: đúng nơi; đúng nơi nhưng sai phương vị từ (书包上 ≠ 书包里, tính là sai nội dung); hoặc nơi khác.
   - Có cụm đúng nơi thì đúng nội dung. Nếu câu nêu thêm nơi khác, gắn cờ cần xem lại (书在书包里，书包在桌子上).
   - Chỉ có nơi khác thì sai nội dung, tối đa 20 điểm. Gắn cờ cần xem lại nếu tên lạ chỉ khác nơi đúng một chữ.
   - Chỉ có câu phủ định (书不在书包里) thì sai nội dung. Không nêu nơi nào thì 0 điểm.
   - Thiếu phương vị từ (书在书包) vẫn đúng nội dung, chỉ bị trừ điểm ngôn ngữ.
2. **Câu hỏi về bản thân** (không có `expected.places`): nơi nào cũng đúng. Tên lạ được chấp nhận nhưng gắn cờ cần xem lại.
3. Lỗi ngôn ngữ trừ điểm như ở các loại khác. Luật `place_order` chỉ báo lỗi khi thỏa mãn đủ các điều kiện sau:
   - cụm 在 đứng cuối mệnh đề (sau nó chỉ có thể là trợ từ 了/呢/吧/吗…);
   - trước nó có một động từ hành động ([verbs.json](../packages/grader/src/lang/zh/data/verbs.json));
   - động từ đứng ngay trước 在 không thuộc nhóm nhận 在 phía sau (住, 放, 坐, 写…);
   - câu không có động từ chuyển động (去, 来, 回, 到).

   Với động từ "đặt để" có tân ngữ, cách sửa dùng 把 (放书在桌子上 → 把书放在桌子上). Động từ đứng sau 的 hoặc lượng từ được coi là danh từ (我的工作在河内 là câu đúng).

## Dữ liệu cần giáo viên duyệt

Danh sách khởi đầu do Claude soạn, **chưa được giáo viên kiểm tra**:

- [ ] [nouns.json](../packages/grader/src/lang/zh/data/nouns.json): 123 danh từ và các lượng từ được chấp nhận; lượng từ đầu tiên là lượng từ được gợi ý khi sửa. Cần xem lại các trường hợp có tranh luận: 电脑 có dùng được 个 không? 椅子 có dùng được 张 không? 苹果 có dùng được 颗 không?
- [ ] [measure-words.json](../packages/grader/src/lang/zh/data/measure-words.json): loại của từng lượng từ và danh sách `erOk` (những chỗ 二 vẫn đúng).
- [ ] [modifiers.json](../packages/grader/src/lang/zh/data/modifiers.json): màu và tính từ dùng cho luật trật tự từ.
- [ ] [non-numbers.json](../packages/grader/src/lang/zh/data/non-numbers.json): các từ chứa chữ số nhưng không phải số.
- [ ] [places.json](../packages/grader/src/lang/zh/data/places.json): 116 từ chỉ nơi chốn (34 tên riêng, 50 nơi chốn, 32 đồ vật kèm phương vị từ mặc định như 桌子 → 上, 书包 → 里), 31 phương vị từ trong 12 nhóm, các từ chỉ thời gian, các từ "không đảo" (上车, 外地…).
- [ ] [verbs.json](../packages/grader/src/lang/zh/data/verbs.json): 91 động từ hành động, 23 động từ nhận 在 phía sau (住在, 放在…), 26 từ trông giống động từ nhưng không phải (学生, 看见, 放假…).
- [ ] [messages.ts](../packages/grader/src/lang/zh/messages.ts): lời nhận xét tiếng Việt.
- [ ] Mức trừ điểm mặc định trong [issues.ts](../packages/grader/src/lang/zh/issues.ts).
- [ ] Các câu hỏi mẫu trong [questions/zh/](../packages/grader/questions/zh/) và điểm mong đợi của từng ví dụ.

## Kiểm thử

- `npm test` chạy gần 300 test: đọc số, chuẩn hóa, từ vựng, phân tích câu và nơi chốn, từng luật (gồm cả các ca **không được** báo lỗi), ba bộ chấm, kiểm tra cấu hình câu hỏi, tất cả ví dụ của các câu hỏi mẫu, và giao diện demo (happy-dom).
- `npm run check` = kiểm tra kiểu TypeScript + test.
- Tốc độ: khoảng 0,1 ms mỗi câu trả lời (sau lần chấm đầu tiên, vốn phải nạp từ điển pinyin).

## Thay đổi khi đưa bộ chấm vào web app (2026-11-15)

- **API mới:** `checkZhSentence(text)` chạy các luật trên một câu, ngoài mọi câu hỏi. Web app dùng nó để giải thích bài sắp xếp câu khi người học xếp sai (我吃饭在家 → `place_order`). Khóa học dùng nó để kiểm tra rằng không câu đúng nào bị báo lỗi. `segments(normalized, issues)` (tô màu chỗ sai) và `normalizeZh` cũng được xuất ra.
- **Không đọc nhầm từ ghép:** bộ chấm biết các từ nhiều chữ của HSK1–3 (`data/words.json`, sinh từ dữ liệu khóa học bằng `npm run data:build -w @c-learn-write/course`, có test giữ đồng bộ). Khi một từ dài hơn của đề cương bắt đầu bằng danh từ vừa nhận ra (书店 so với 书) và bảng danh từ không có dữ liệu cho từ đó, danh từ được coi là "lạ" và các luật im lặng. Trước đây câu đúng 学校外边有一个书店 bị báo sai lượng từ.
- **Danh từ sau một từ lạ:** với câu hỏi đếm, danh từ cần đếm đứng sau 1–2 chữ lạ (两个女医生) được nhận đúng nội dung nhưng gắn cờ `needsReview`, vì có thể là một từ khác (熊猫 không phải 猫).
- **Đồng âm đổi nghĩa:** 买 / 卖 cùng pinyin nhưng nghĩa ngược nhau, nên không bao giờ được coi là gõ nhầm.

## Hướng phát triển

1. Nhờ giáo viên duyệt dữ liệu ở danh sách trên; bổ sung danh từ, nơi chốn và động từ theo giáo trình.
2. Ghi lại các câu trả lời thật cùng kết quả chấm. Những câu có cờ `needsReview` được giáo viên xem rồi bổ sung vào đáp án mẫu hoặc luật.
3. Luật trật tự cho câu có động từ chuyển động (我去学习在图书馆 → 我去图书馆学习) và cho cụm thời gian (我吃饭在晚上 → 我晚上吃饭).
4. Cho phép trả lời bằng pinyin và chấm thanh điệu.
5. Gói tiếng Anh (`src/lang/en`) cho app tiếng Anh.
