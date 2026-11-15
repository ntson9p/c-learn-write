# Kế hoạch: web app dạy tiếng Trung HSK1–HSK3 cho người Việt

> **Trạng thái: đã được chủ dự án duyệt ngày 2026-11-14.** Kế hoạch viết ở giai đoạn 1 (khảo sát và quyết định); tiến độ thực hiện từng giai đoạn được ghi trong [handoff.md](handoff.md).
>
> Tài liệu liên quan: [handoff.md](handoff.md) (bàn giao), [design.md](design.md) (thiết kế bộ chấm), [README.md](../README.md).

## 1. Mục tiêu

Xây một **web app hoàn chỉnh dạy từ vựng và ngữ pháp tiếng Trung** cho người Việt. App đưa người học từ con số 0 tới trình độ **HSK3** theo **đề cương thi HSK mới (2025)**, và dùng lại bộ chấm hiện có để chấm các bài trả lời tự luận ngắn.

Các nguyên tắc giữ nguyên từ bộ chấm:

1. **Không dùng LLM/AI khi app chạy.** Việc chấm điểm hoàn toàn bằng luật và tất định: cùng một câu trả lời luôn cho cùng một kết quả.
2. **Chính xác trước, đầy đủ sau.** Luật chỉ báo lỗi khi chắc chắn. Khi không chắc, bộ chấm gắn cờ "cần giáo viên xem lại".
3. **Nội dung là JSON**, để giáo viên đọc, duyệt và sửa được mà không cần đụng vào code.
4. **Tiếng Việt** cho giao diện, giải thích và lời nhận xét. Ưu tiên các lỗi do thói quen tiếng Việt.
5. **Ưu tiên điện thoại**, dùng được khi không có mạng.

**Ngoài phạm vi** của kế hoạch này:
- server, tài khoản, đồng bộ giữa các thiết bị;
- trả lời bằng pinyin hoặc giọng nói, nhận dạng giọng nói;
- HSK4 trở lên, app tiếng Anh;
- đề thi thử sao chép từ đề thi thật.

## 2. Các quyết định đã chốt (2026-11-14)

Chủ dự án trả lời 12 câu hỏi trắc nghiệm và chọn phương án khuyên dùng ở cả 12 câu.

| # | Vấn đề | Quyết định | Hệ quả chính |
|---|---|---|---|
| 1 | Chuẩn HSK | **Đề cương thi HSK 2025** (HSK 3.0): HSK1 300 từ, HSK2 500, HSK3 1000 (cộng dồn) | Danh sách từ, chữ và ngữ pháp lấy theo đề cương này, không theo danh sách của chuẩn GF 0025-2021 |
| 2 | Ai soạn nội dung tiếng Việt | **Claude soạn nháp trong lúc phát triển, giáo viên duyệt.** Ràng buộc "không AI" chỉ áp dụng khi app chạy | Mọi mục nội dung đều có trạng thái duyệt, mặc định là "nháp" |
| 3 | Cách duyệt | **Bảng tính + nhãn "Chưa duyệt"**: script xuất JSON ra bảng tính, giáo viên ghi "đạt/cần sửa" và góp ý, script nhập kết quả lại | App vẫn dùng nội dung nháp, kèm nhãn rõ ràng |
| 4 | Giấy phép, công khai | **Repo công khai; code theo MIT; nội dung theo CC BY-SA 4.0** | Thêm LICENSE, giấy phép nội dung, THIRD_PARTY_NOTICES và trang "Giấy phép" trong app |
| 5 | Kiến trúc | **PWA chạy hoàn toàn trên máy**; tiến độ lưu trong IndexedDB; xuất/nhập file sao lưu | Không server, không thu thập dữ liệu cá nhân; host tĩnh (GitHub Pages) |
| 6 | Framework | **Preact + Vite** (app một trang) | Dùng chung Vite và Vitest với bộ chấm |
| 7 | Cấu trúc repo | **Monorepo npm workspaces** | `packages/grader`, `packages/course`, `apps/web` (mục 4) |
| 8 | Âm thanh | **Giọng đọc của thiết bị** (Web Speech API) | Tự ẩn nút nghe khi máy không có giọng tiếng Trung; có trang hướng dẫn cài giọng |
| 9 | Ôn tập ngắt quãng | **FSRS qua thư viện ts-fsrs** | Khóa đúng phiên bản; test với đồng hồ cố định |
| 10 | Luyện viết chữ | **Làm cùng HSK2** (hanzi-writer + dữ liệu nét của Make Me a Hanzi) | HSK1 chưa có phần luyện viết (xem ghi chú ở mục 3.1) |
| 11 | Phát hành | **Từng cấp, kèm nhãn nháp**: xong HSK1 thì phát hành, rồi tới HSK2, HSK3 | Có bản dùng thật sớm; mỗi lần triển khai đều hỏi chủ dự án trước |
| 12 | Nhập câu trả lời | **Bộ gõ pinyin của máy + thẻ chữ** | Có trang hướng dẫn cài bộ gõ; bài sắp xếp câu không cần bộ gõ |

## 3. Kết quả khảo sát

Cột "Kiểm chứng" ghi ai đã đối chiếu với nguồn gốc. "Claude" nghĩa là đã tự mở và đọc nguồn trong phiên 2026-11-14. "Agent" nghĩa là chỉ có agent tìm hiểu đọc nguồn đó.

### 3.1 Chuẩn HSK

| Thông tin | Giá trị | Nguồn | Kiểm chứng |
|---|---|---|---|
| Đề cương thi mới | 《中文水平考试 HSK 考试大纲》. Bìa ghi "2025-11 发布, 2026-07 实施", do 中外语言交流合作中心 (CLEC) phát hành; 406 trang | [PDF chính thức][syllabus], có liên kết từ [chinesetest.cn/HSK][cts] | Claude: tự tải trang chinesetest.cn và file PDF (SHA-256 `d8b66465…`, sửa lần cuối 2026-10-30) |
| Kỳ thi HSK 3.0 chính thức đầu tiên | **13/12/2026**, trên toàn cầu | [chisa.edu.cn][chisa], đăng lại thông báo của CLEC | Claude: tự đọc trang |
| Từ vựng | HSK1 300 từ (số 1–300), HSK2 thêm 200 (301–500), HSK3 thêm 500 (501–1000) | PDF, phần 词汇大纲 | Claude: tự đếm từ PDF |
| Chữ nhận biết (认读字) | 246 / thêm 125 / thêm 284 (cộng dồn 655) | PDF, phần 汉字大纲 | Claude: tự đếm từ PDF |
| Chữ viết tay (书写字) | Một danh sách chung "HSK1~2" gồm 100 chữ; HSK3 thêm 150 (cộng dồn 250) | PDF, phần 汉字大纲 | Claude: tự đếm từ PDF |
| Điểm ngữ pháp | 70 / 78 / 96 (cộng dồn 244); mỗi điểm có câu ví dụ | Hệ thống tra cứu chính thức, qua bản sao [ofou/hsk][ofou] | Claude: tự đếm trong file CSV của bản sao |
| Chuẩn GF 0025-2021 | Chuẩn giảng dạy, có hiệu lực từ 2021-07-01. Cấp 1–3 có 500 / 1272 / 2245 từ (cộng dồn), 210 điểm ngữ pháp, 608 âm tiết | [PDF của Bộ Giáo dục Trung Quốc][gf0025] | Agent đối chiếu PDF; Claude chưa tự mở |
| HSK 2.0 (150/300/600 từ) | Chưa thấy thông báo chính thức về ngày ngừng thi. Nguồn bên thứ ba ([LSE][lse]) ghi là không tổ chức nữa từ 12/2026 | | **Chưa kiểm chứng từ nguồn chính thức** |

**Kết luận.** Người học bắt đầu từ bây giờ sẽ thi theo HSK 3.0, nên app bám theo đề cương 2025. Đề cương còn mới (bản PDF chính thức được sửa lần cuối ngày 30/10/2026), nên dữ liệu nhập vào phải ghi rõ phiên bản và có script nhập lại để so khác biệt.

**Ghi chú về chữ viết tay.** PDF đặt tên danh sách 100 chữ đầu tiên là "HSK（一级）~（二级）书写字", tức là chung cho HSK1 và HSK2. Hệ thống tra cứu chính thức thì xếp cả 100 chữ vào HSK2 (HSK1: 0 chữ). Vì vậy, làm phần luyện viết cùng HSK2 vẫn đúng với cách hệ thống tra cứu phân cấp.

### 3.2 Nguồn dữ liệu và thư viện sẽ dùng

| Nguồn | Dùng để | Giấy phép | Nghĩa vụ | Kiểm chứng |
|---|---|---|---|---|
| [ofou/hsk][ofou] | Danh sách từ HSK1–3 (pinyin, từ loại), chữ nhận biết, chữ viết tay, danh sách điểm ngữ pháp | MIT ("Copyright (c) 2021 Shawky") | Giữ thông báo MIT; ghi nguồn CLEC và chinesetest.cn | Claude: đọc LICENSE; so **1000/1000 từ HSK1–3 khớp với PDF** (số thứ tự, cấp, từ) |
| [ph0ngp/hanviet-pinyin-wordlist][hanviet] | Âm Hán Việt theo chữ và pinyin | MIT (Phong Phan) | Giữ thông báo MIT | Claude: đọc LICENSE. Agent báo phủ 100% chữ HSK1–3; Claude chưa tự kiểm |
| [ts-fsrs][fsrs] 6.0.0 | Lịch ôn tập FSRS | MIT; phụ thuộc srs-kit 1.0.0 (BSD-3-Clause) | Giữ thông báo | Claude: LICENSE và npm |
| [hanzi-writer][hw] 3.7.3 | Hoạt hình thứ tự nét, luyện viết (HSK2) | MIT | Giữ thông báo | Claude |
| [hanzi-writer-data][hwd] 2.0.1 | Dữ liệu nét chữ, lấy từ Make Me a Hanzi | Arphic Public License | Giữ nguyên file và kèm `ARPHICPL.TXT`; nếu sửa file thì phải ghi chú trong file | Claude: đọc README |
| Preact, preact-iso, @preact/signals, @preact/preset-vite, vite-plugin-pwa | Giao diện, điều hướng, trạng thái, PWA | MIT | Giữ thông báo | Claude: npm (đều hỗ trợ Vite 8) |
| idb; fake-indexeddb (chỉ dùng khi test) | IndexedDB | ISC; Apache-2.0 | Giữ thông báo | Claude: npm |

Các nguồn đã xem nhưng **không đưa vào app**:

- **CVDICT** (từ điển Trung–Việt, CC BY-SA 4.0): README của tác giả ghi phần lớn nghĩa do ChatGPT-4o dịch máy từ CC-CEDICT. Chỉ dùng để tham khảo khi soạn nghĩa, không chép.
- **CC-CEDICT** (CC BY-SA 4.0): chỉ có nghĩa tiếng Anh, không cần.
- **ivankra/hsk30, drkameleon/complete-hsk-vocabulary** (MIT): danh sách của chuẩn 2021 và HSK 2.0. Chỉ dùng để đối chiếu.
- **krmanik/HSK-3.0** (CC BY-SA 4.0): chỉ dùng để đối chiếu.
- **Tatoeba** (CC BY 2.0 FR): agent báo chỉ có khoảng 800 cặp câu Trung–Việt trực tiếp, quá ít.
- **audio-cmn** (CC BY-SA, ghi âm người thật): để dành nếu sau này bổ sung âm thanh. Giấy phép và độ phủ chưa kiểm chứng.
- **AllSet Chinese Grammar Wiki**: CC BY-NC-SA, cấm dùng thương mại, nên không dùng.

### 3.3 Lưu ý về bản quyền (không phải ý kiến pháp lý)

- Đề cương thi không kèm giấy phép. Danh sách từ, cấp độ, pinyin và từ loại gần như là dữ kiện và được nhiều app dùng, nên rủi ro thấp. App sẽ ghi rõ nguồn (CLEC, chinesetest.cn).
- **Câu ví dụ chính thức** trong đề cương là văn bản sáng tạo, nên không chép vào app hay vào repo. Câu ví dụ của app do Claude tự viết. Câu ví dụ chính thức chỉ dùng để tham khảo khi soạn, và làm bộ câu đúng để thử luật: script tải chúng về máy khi cần, không lưu vào repo.
- Nội dung tự soạn theo CC BY-SA 4.0: app phải ghi giấy phép và nguồn, và không được khóa nội dung bằng biện pháp kỹ thuật.

## 4. Kiến trúc

### 4.1 Cấu trúc repo

```
package.json                  workspaces + scripts chung: check, test, typecheck, dev, build
LICENSE                       MIT (code)
THIRD_PARTY_NOTICES.md        giấy phép của dữ liệu và thư viện bên thứ ba
.github/workflows/ci.yml      npm ci + npm run check, trên Node 22 và 24

packages/grader/              bộ chấm hiện tại, chuyển nguyên trạng bằng git mv: src/, questions/, tests/, demo/
packages/course/              nội dung khóa học
  data/                       JSON: words/, characters/, grammar/, lessons/  (CC BY-SA 4.0)
  sources/                    dữ liệu nhập nguyên gốc, kèm phiên bản, checksum, giấy phép
  src/                        kiểu dữ liệu, hàm đọc, hàm kiểm tra
  scripts/                    nhập dữ liệu; xuất/nhập bảng tính duyệt
  tests/                      kiểm tra toàn bộ nội dung
  LICENSE                     CC BY-SA 4.0
apps/web/                     app Preact (PWA)
  src/                        màn hình, thành phần giao diện, lưu trữ, ôn tập, âm thanh
  tests/                      test thành phần (happy-dom) và test đầu-cuối (Playwright)
docs/                         plan.md, handoff.md, design.md, content-guide.md (hướng dẫn soạn và duyệt)
```

- **Chiều phụ thuộc:** `apps/web` dùng `packages/course` và `packages/grader`; `packages/course` dùng `packages/grader` để tự kiểm tra các bài tự luận.
- App chỉ dùng API công khai của bộ chấm (`grade`, `validateQuestion`, …). Một test sẽ kiểm tra để app không import vào bên trong bộ chấm.

### 4.2 App

Các mục chính, chuyển qua thanh điều hướng ở cuối màn hình (hợp với điện thoại):

| Mục | Nội dung |
|---|---|
| Học | Lộ trình HSK1 → HSK3, danh sách bài. Mỗi bài gồm từ mới, ngữ pháp, bài tập |
| Ôn tập | Thẻ từ đến hạn ôn (FSRS); học từ mới trong giới hạn mỗi ngày |
| Từ điển | Tra 1000 từ: chữ Hán, pinyin, âm Hán Việt, nghĩa, ví dụ, nghe |
| Tiến độ | Số từ đã học và đã nhớ, bài đã xong, điểm kiểm tra, điểm ngữ pháp còn yếu |
| Cài đặt | Giọng đọc, số từ mới mỗi ngày, sao lưu và khôi phục, hướng dẫn cài bộ gõ và giọng đọc, giấy phép |

- **Lưu trữ:** IndexedDB (thư viện `idb`), có số phiên bản và hàm chuyển đổi khi đổi cấu trúc dữ liệu. App xin quyền lưu trữ bền vững (`navigator.storage.persist`) và nhắc sao lưu định kỳ. Trên iPhone, Safari có thể xóa dữ liệu của trang web chưa được "Thêm vào màn hình chính" sau một thời gian không dùng, nên app sẽ khuyên cài lên màn hình chính. (Cần kiểm tra lại điểm này trên thiết bị thật.)
- **Offline:** service worker (vite-plugin-pwa) lưu sẵn app và dữ liệu.
- **Tải theo nhu cầu:** bộ chấm (khoảng 220 KB sau nén, phần lớn là từ điển pinyin và OpenCC) và dữ liệu của từng cấp chỉ được tải khi cần.
- **Âm thanh:** một lớp bọc Web Speech API, có nhiệm vụ tìm giọng `zh-CN`, chỉnh tốc độ và ẩn nút nghe khi máy không có giọng phù hợp.
- **Âm Hán Việt:** hiện kèm mỗi từ để tham khảo (ví dụ 学生: học sinh). App cảnh báo các từ có nghĩa khác với từ Hán Việt quen thuộc trong tiếng Việt.
- **Không thu thập dữ liệu:** không có analytics, không gửi gì ra ngoài. Lưu ý: một số giọng đọc của hệ điều hành chạy qua mạng; điều này được ghi rõ trong trang giới thiệu.
- **Phông chữ:** dùng phông có sẵn của máy (Noto Sans CJK, PingFang…), không nhúng phông, để app nhẹ.

## 5. Mô hình dữ liệu (JSON)

Mỗi mục nội dung có:

- `id` cố định, không đổi khi sửa nội dung;
- `review`: `{ "status": "draft" | "approved" | "changes_requested", "by"?, "date"?, "note"? }`;
- nguồn, nếu mục đó lấy từ bên ngoài.

Ví dụ một từ (nội dung minh họa, chưa duyệt):

```json
{
  "id": "w0001",
  "no": 1,
  "level": 1,
  "word": "爱",
  "pinyin": "ài",
  "pos": ["动"],
  "hanViet": "ái",
  "meaningsVi": ["yêu", "thích"],
  "examples": [{ "zh": "我爱妈妈。", "pinyin": "Wǒ ài māma.", "vi": "Con yêu mẹ." }],
  "lesson": "hsk1-01",
  "review": { "status": "draft" }
}
```

| Loại | File | Trường chính |
|---|---|---|
| Từ | `data/words/hsk1.json`, … | id, no (số thứ tự trong đề cương), level, word, pinyin, pos, hanViet, meaningsVi, noteVi, examples, lesson |
| Chữ | `data/characters.json` | chữ, cấp nhận biết, cấp viết tay, âm Hán Việt |
| Điểm ngữ pháp | `data/grammar/hsk1.json`, … | id, level, official (nhóm, mục, nội dung theo đề cương), titleVi, explanationVi, patterns, examples (câu đúng), mistakes (câu sai → câu đúng, giải thích, mã lỗi của bộ chấm nếu có), lesson |
| Bài học | `data/lessons/hsk1/01-….json` | id, level, order, titleVi, topic, words, grammar, exercises |
| Bài tập | nằm trong file bài học | `type` cộng với dữ liệu riêng của từng dạng (mục 6) |

**Kiểm tra tự động** (chạy trong `npm run check`):

- `id` không trùng; mọi tham chiếu (bài học → từ, điểm ngữ pháp) đều tồn tại.
- **Phủ đủ đề cương:** mỗi từ, chữ và điểm ngữ pháp của một cấp nằm trong đúng một bài.
- Pinyin đúng cú pháp (âm tiết hợp lệ, dấu thanh đúng chỗ), và pinyin của từ khớp với đề cương.
- **Kiểm soát từ vựng:** câu ví dụ và bài tập của một bài chỉ dùng các từ đã học tới bài đó, cộng một danh sách tên riêng được phép. Câu nào dùng từ chưa học sẽ bị báo.
- Bài tập có đáp án nhất quán: đáp án đúng nằm trong các lựa chọn, các thẻ chữ ghép được thành đáp án, v.v.
- Bài tự luận: mọi câu hỏi qua `validateQuestion`; câu mẫu được 100 điểm; các ví dụ kèm theo cho đúng điểm đã ghi (theo cơ chế hiện có của bộ chấm).
- **Bộ câu đúng:** chạy các luật của bộ chấm trên mọi câu ví dụ đúng của khóa học. Không luật nào được báo lỗi ở bất kỳ câu nào.

## 6. Bài tập và cách chấm

| Dạng | Ví dụ | Cách chấm (tất định) |
|---|---|---|
| Trắc nghiệm | 「苹果」 nghĩa là gì? Chọn 不 hay 没? | So với đáp án |
| Ghép cặp | Chữ Hán ↔ nghĩa, chữ Hán ↔ pinyin | So với các cặp đúng |
| Nghe và chọn | Nghe một từ (giọng thiết bị), chọn chữ Hán | So với đáp án; ẩn khi máy không có giọng |
| Sắp xếp câu | Bấm các thẻ 我 / 在 / 家 / 吃饭 thành câu | So với danh sách các thứ tự được chấp nhận. Nếu sai, chạy luật của bộ chấm trên câu vừa ghép để giải thích (ví dụ 我吃饭在家 → `place_order`) |
| Điền vào chỗ trống | 我___学生。(是) | Danh sách đáp án được chấp nhận, so sau khi chuẩn hóa |
| Dịch Việt → Trung | "Tôi là người Việt Nam." | Bộ chấm loại `model`, với đáp án mẫu viết bằng cú pháp `[a\|b](x)` |
| Trả lời câu hỏi | 图片里有几个苹果？ / 书在哪儿？ | Bộ chấm loại `count`, `location`, `model` và các loại mới |

**Mở rộng bộ chấm theo từng điểm ngữ pháp.** Với mỗi điểm ngữ pháp, tôi tìm các lỗi hay gặp, ưu tiên lỗi do thói quen tiếng Việt. Một luật mới chỉ được thêm khi đạt đủ ba điều kiện:

1. có danh sách câu sai mà luật phải bắt, và danh sách câu đúng mà luật **không được** bắt;
2. không báo lỗi câu nào trong bộ câu đúng của khóa học, và cả bộ câu ví dụ chính thức (chạy trên máy, không lưu vào repo);
3. có lời nhận xét tiếng Việt và cách sửa rõ ràng, và được ghi vào `docs/design.md`.

Các ứng viên ban đầu (cần nghiên cứu thêm, chưa hứa làm hết):

- cụm thời gian đặt sau động từ: 我吃饭晚上 → 我晚上吃饭;
- sở hữu đặt sau danh từ: 书我的 → 我的书;
- 很 đặt sau tính từ: 好很 → 很好;
- 有 + động từ theo kiểu "có đi": 我有去 → 我去过 / 我去了;
- 比 đặt sai chỗ: 我高比他 → 我比他高;
- bổ ngữ trạng thái thiếu 得: 他跑很快 → 他跑得很快;
- các lỗi về 了, 过, 着.

Điểm ngữ pháp nào không có luật đủ chính xác thì chỉ dạy bằng bài tập đóng (trắc nghiệm, sắp xếp câu, đáp án mẫu). Cuối mỗi giai đoạn có bảng báo cáo trung thực: điểm ngữ pháp nào có luật riêng, điểm nào chưa.

## 7. Lộ trình học

Ước lượng ban đầu, sẽ chỉnh lại khi xếp từ và ngữ pháp vào bài:

| Cấp | Từ mới | Chữ nhận biết mới | Chữ viết tay mới | Điểm ngữ pháp | Số bài dự kiến |
|---|---|---|---|---|---|
| HSK1 | 300 | 246 | – | 70 | khoảng 15 |
| HSK2 | 200 | 125 | 100 | 78 | khoảng 10 |
| HSK3 | 500 | 284 | 150 | 96 | khoảng 20 |

- **Bài học theo chủ đề của đề cương** (话题大纲). HSK1 dự kiến có các bài: chào hỏi và làm quen; gia đình, tuổi; số đếm, ngày tháng, giờ; đồ vật và lượng từ; nơi chốn và phương hướng; ăn uống; mua sắm, giá tiền; đi lại, hỏi đường; thời tiết; sức khỏe; sở thích; học tập, trường lớp; công việc, nghề nghiệp; văn hóa ẩm thực; ôn tập.
- **Mỗi bài** gồm khoảng 20 từ mới, 4–5 điểm ngữ pháp, 20–30 bài tập và một bài kiểm tra ngắn. Các điểm ngữ pháp mang tính khái niệm (ví dụ "danh từ làm chủ ngữ") được gộp vào phần giải thích chung.
- **Mở bài:** bài sau mở khi bài trước đạt ngưỡng (ví dụ 80%). Người học vẫn có thể chọn "học vượt".
- Từ của bài đã học tự động được đưa vào hàng ôn tập FSRS.
- **Bài kiểm tra cấp:** mỗi cấp có một bài kiểm tra tổng hợp, gồm câu hỏi tự soạn mô phỏng các phần nghe, đọc và viết, không sao chép đề thi thật.

## 8. Các giai đoạn

Mỗi giai đoạn kết thúc bằng các bước sau:

- `npm run check` qua;
- commit theo từng bước;
- cập nhật `docs/handoff.md`;
- báo cáo cho chủ dự án: cái gì đã kiểm chứng, cái gì chưa.

### Giai đoạn 0: Tiếp nhận (xong ngày 2026-11-14)

Đã đọc tài liệu; môi trường dùng Node 22.23.4; `npm ci` chạy xong; `npm run check` qua 18 file test, 295 test.

### Giai đoạn 1: Khảo sát và quyết định (xong ngày 2026-11-14)

Đã tìm hiểu chuẩn HSK và dữ liệu mở (mục 3), chốt 12 quyết định (mục 2) và viết kế hoạch này.

**Tiêu chí hoàn thành**

- [x] Chủ dự án duyệt `docs/plan.md`.
- [x] `docs/handoff.md` được cập nhật theo các quyết định.

### Giai đoạn 2: Nền tảng

**Phạm vi**

- **Giấy phép:** thêm `LICENSE` (MIT), giấy phép nội dung (CC BY-SA 4.0) và `THIRD_PARTY_NOTICES.md`.
- **Workspaces:** dùng `git mv` để chuyển bộ chấm vào `packages/grader`, giữ lịch sử. `npm run check` ở thư mục gốc chạy kiểm tra kiểu và test của mọi package. Cập nhật đường dẫn trong README, design.md và handoff.md.
- **CI GitHub Actions:** chạy `npm ci && npm run check` trên Node 22 và 24 cho mỗi lần push và mỗi pull request.
- **Khung `apps/web`** (Vite + Preact + TypeScript):
  - điều hướng và bố cục ưu tiên điện thoại (thanh điều hướng dưới), chế độ sáng/tối;
  - mọi chuỗi giao diện tiếng Việt đặt ở một chỗ;
  - PWA (manifest, service worker);
  - lớp lưu trữ IndexedDB có số phiên bản, xuất/nhập sao lưu;
  - trang "Chấm thử" dùng bộ chấm như một thư viện, và trang "Giới thiệu và giấy phép".
- **Test:**
  - thành phần giao diện: Vitest + happy-dom + Testing Library;
  - lưu trữ: fake-indexeddb;
  - đầu-cuối: Playwright, với khung điện thoại và chế độ offline.

**Tiêu chí hoàn thành**

- [ ] `npm ci && npm run check` qua ở thư mục gốc. 295 test cũ của bộ chấm vẫn qua, không sửa nội dung test.
- [ ] CI chạy xanh trên GitHub. Nếu quyền push file workflow bị chặn, tôi ghi rõ và nhờ chủ dự án thêm file đó.
- [ ] App chạy được bằng `npm run dev`. Ảnh chụp màn hình khung 375×812 đã được kiểm tra. Test đầu-cuối xác nhận app vẫn mở được khi mất mạng, sau lần tải đầu.
- [ ] Trang "Chấm thử" chấm 9 câu hỏi mẫu ra đúng điểm như test của bộ chấm.
- [ ] Đã đo và ghi lại kích thước bundle (JS ban đầu và phần bộ chấm).

### Giai đoạn 3: Dữ liệu

**Phạm vi**

- **`packages/course`:** kiểu dữ liệu và hàm kiểm tra cho từ, chữ, điểm ngữ pháp, bài học, bài tập; hàm đọc dữ liệu cho app.
- **Script nhập từ ofou/hsk** (khóa theo commit, có checksum): nhập từ, chữ nhận biết, chữ viết tay và danh sách ngữ pháp HSK1–3, không lấy câu ví dụ chính thức. Chạy lại script phải ra kết quả y hệt. Khi nguồn thay đổi, script báo các chỗ khác biệt.
- **Script nhập âm Hán Việt** (ph0ngp, MIT): ghép theo chữ phồn thể và pinyin. Chữ nào không ghép được thì đánh dấu để soạn tay.
- **Công cụ duyệt:**
  - `review:export` xuất CSV dạng UTF-8 có BOM, để Excel hiển thị đúng tiếng Việt và chữ Hán;
  - `review:import` đọc kết quả duyệt, cập nhật trạng thái và góp ý;
  - hướng dẫn cho giáo viên trong `docs/content-guide.md`.
- **Nội dung HSK1 (nháp):** nghĩa tiếng Việt và câu ví dụ (chữ Hán, pinyin, bản dịch) cho 300 từ; chia 300 từ và 70 điểm ngữ pháp vào khoảng 15 bài.
- Toàn bộ các kiểm tra tự động ở mục 5.

**Tiêu chí hoàn thành**

- [ ] Đủ 300/300 từ HSK1; mỗi từ có pinyin, từ loại, âm Hán Việt, ít nhất một nghĩa, và một câu ví dụ có pinyin và bản dịch.
- [ ] Có mặt đủ 246/246 chữ nhận biết HSK1.
- [ ] Có mặt đủ 70/70 điểm ngữ pháp HSK1 (kèm thông tin gốc trong đề cương), và tất cả đã được xếp vào bài.
- [ ] Mọi kiểm tra tự động qua trong CI. Nhập lại từ nguồn cho ra các file y hệt.
- [ ] Vòng xuất CSV → sửa → nhập lại chạy đúng (có test cho trọn vòng). File CSV mở được bằng Excel hoặc Google Sheets (chủ dự án thử).
- [ ] `THIRD_PARTY_NOTICES.md` và README của dữ liệu ghi đủ nguồn, giấy phép, phiên bản.

### Giai đoạn 4: Từ vựng

**Phạm vi**

- **Danh sách từ** theo bài và theo cấp.
- **Thẻ từ:** chữ lớn, pinyin, âm Hán Việt, nghĩa, ví dụ, nút nghe, nhãn "Chưa duyệt".
- **Học từ mới và ôn tập bằng FSRS** (ts-fsrs, khóa phiên bản): 4 nút Quên / Khó / Được / Dễ, giới hạn số từ mới mỗi ngày, hàng thẻ đến hạn.
- **Các kiểu luyện từ:** chữ → nghĩa, nghĩa → chữ, nghe → chữ, chọn pinyin và thanh điệu.
- **Âm thanh:** lớp bọc Web Speech; trang hướng dẫn cài giọng đọc và bộ gõ.
- **Lưu tiến độ**, sao lưu và khôi phục.

**Tiêu chí hoàn thành**

- [ ] Học và ôn được trọn 300 từ HSK1 trên khung điện thoại, kể cả khi mất mạng (test đầu-cuối).
- [ ] Tiến độ còn nguyên sau khi tải lại trang. Xuất rồi nhập lại file sao lưu cho ra đúng trạng thái cũ (có test).
- [ ] Lịch ôn FSRS được test với đồng hồ cố định, cho kết quả tất định.
- [ ] Trên máy không có giọng tiếng Trung, nút nghe tự ẩn và có hướng dẫn (test giả lập).

### Giai đoạn 5: Ngữ pháp và bài tập (HSK1)

**Phạm vi**

- **Trang giải thích ngữ pháp:** giải thích bằng tiếng Việt, mẫu câu, ví dụ đúng/sai, so sánh với tiếng Việt.
- **Bộ máy bài tập** cho 7 dạng ở mục 6, với lời nhận xét tiếng Việt.
- **Bài học:** khoảng 15 bài HSK1 có đủ từ, ngữ pháp, bài tập; bài mở dần theo tiến độ.
- **Mở rộng bộ chấm** cho các điểm ngữ pháp HSK1, theo các điều kiện ở mục 6:
  - thêm loại câu hỏi mới nếu cần, ví dụ hỏi giờ hoặc ngày tháng;
  - thêm API công khai để chạy riêng các luật trên một câu (dùng cho bài sắp xếp câu).
- **Nội dung (nháp):** giải thích cho 70 điểm ngữ pháp, và bài tập cho từng bài.

**Tiêu chí hoàn thành**

- [ ] Cả 70/70 điểm ngữ pháp HSK1 có trang giải thích và ít nhất 3 bài tập.
- [ ] Mọi bài HSK1 làm được từ đầu đến cuối (có test đầu-cuối cho ít nhất một bài đầy đủ).
- [ ] Mọi bài tập qua kiểm tra tự động, và bộ câu đúng không bị báo nhầm câu nào.
- [ ] Có bảng báo cáo: điểm ngữ pháp nào có luật riêng trong bộ chấm, điểm nào chỉ có bài tập đóng.

### Giai đoạn 6: Kiểm tra và tiến độ

**Phạm vi**

- **Bài kiểm tra cuối bài và bài kiểm tra cấp HSK1:** phần nghe (giọng thiết bị), đọc, sắp xếp câu, viết ngắn (do bộ chấm chấm). Báo cáo kết quả bằng tiếng Việt, kèm các điểm ngữ pháp còn yếu.
- **Trang tiến độ:** số từ đã học và đã nhớ, số thẻ đến hạn, bài đã xong, điểm kiểm tra, chuỗi ngày học.

**Tiêu chí hoàn thành**

- [ ] Làm được bài kiểm tra HSK1 và xem được báo cáo.
- [ ] Các con số trên trang tiến độ khớp với dữ liệu đã lưu (có test).

### Giai đoạn 7: Phát hành bản HSK1

**Phạm vi**

- **Khả năng truy cập:** dùng được bằng bàn phím, có nhãn cho trình đọc màn hình, đủ độ tương phản, gắn `lang="zh-CN"` cho chữ Hán.
- **Hiệu năng:** đặt ngân sách kích thước và tốc độ, kiểm tra lại chế độ offline.
- **Triển khai:** workflow đưa app lên GitHub Pages. Chủ dự án bật Pages, và tôi **hỏi trước khi triển khai**.
- **Tài liệu:** cập nhật README và hướng dẫn sử dụng.

**Tiêu chí hoàn thành**

- [ ] Bản HSK1 chạy trên địa chỉ GitHub Pages, có báo cáo Lighthouse (PWA, khả năng truy cập, hiệu năng).
- [ ] Đã thử bằng giả lập Android Chrome và iPhone Safari (Playwright); chủ dự án đã thử trên điện thoại thật.
- [ ] Chủ dự án đồng ý phát hành.

### Giai đoạn 8: HSK2 (kèm luyện viết)

**Phạm vi**

- **Nội dung HSK2:** 200 từ, 78 điểm ngữ pháp, khoảng 10 bài; luật bộ chấm cho HSK2; bài kiểm tra HSK2.
- **Luyện viết:** hoạt hình thứ tự nét và bài tập viết (hanzi-writer) cho 100 chữ viết tay. Dữ liệu nét chỉ gồm các chữ cần dùng, kèm `ARPHICPL.TXT`.

**Tiêu chí hoàn thành**

- [ ] Các tiêu chí của giai đoạn 3–7, áp dụng cho HSK2.
- [ ] Cả 100/100 chữ viết tay có bài luyện.
- [ ] Phát hành bản HSK2 (hỏi trước).

### Giai đoạn 9: HSK3

**Phạm vi**

Nội dung HSK3 (500 từ, 96 điểm ngữ pháp, khoảng 20 bài), luật bộ chấm, bài kiểm tra HSK3, luyện viết thêm 150 chữ.

**Tiêu chí hoàn thành**

- [ ] Các tiêu chí như trên, áp dụng cho HSK3.
- [ ] Phát hành bản HSK1–3 hoàn chỉnh (hỏi trước).

### Làm song song: duyệt nội dung

Từ sau giai đoạn 3, mỗi đợt nội dung mới được xuất ra bảng tính cho giáo viên. Kết quả duyệt được nhập lại vào JSON. Nhãn "Chưa duyệt" chỉ được gỡ khi giáo viên đã duyệt mục đó.

## 9. Cách làm việc

- **Git:**
  - làm trên nhánh `claude/gifted-euler-v75r1k`, không commit vào `master`;
  - push lên nhánh này sau mỗi bước để không mất việc khi môi trường cloud bị thu hồi;
  - hỏi chủ dự án trước khi mở pull request, merge hoặc triển khai.
- **Commit:** theo từng bước, kiểu conventional commits, viết bằng tiếng Anh. Chạy `npm run check` trước mỗi commit, và chạy lệnh kiểm tra ký tự vô hình (handoff mục 7) trước mỗi commit có chữ Hán.
- **Luật mới:** mỗi luật có test "phải bắt" và test "không được bắt". Mỗi lỗi báo nhầm tìm được sẽ trở thành một test.
- **Thư viện bên ngoài:**
  - khóa đúng phiên bản, ưu tiên bản đã phát hành ít nhất 2 tuần;
  - ghi giấy phép vào `THIRD_PARTY_NOTICES.md`.
- **Báo cáo cuối mỗi giai đoạn:** đã làm gì, đã kiểm chứng gì (kèm lệnh hoặc test), chưa kiểm chứng gì.

## 10. Rủi ro và cách giảm

| Rủi ro | Cách giảm |
|---|---|
| Nội dung nháp có lỗi (nghĩa, ví dụ, giải thích) | Nhãn "Chưa duyệt"; kiểm tra tự động; giáo viên duyệt qua bảng tính; ưu tiên duyệt HSK1 trước |
| Luật mới báo nhầm câu đúng | Ba điều kiện ở mục 6; bộ câu đúng; cờ "cần xem lại" khi không chắc |
| Đề cương thay đổi | Ghi phiên bản và checksum của nguồn; script nhập lại và báo khác biệt |
| Giọng đọc kém hoặc máy không có giọng | Tự phát hiện và ẩn nút nghe; có hướng dẫn cài giọng; để sẵn chỗ cho file ghi âm sau này |
| Mất tiến độ (xóa dữ liệu trình duyệt, Safari tự dọn dữ liệu) | Xin quyền lưu trữ bền vững; nhắc sao lưu; khuyên cài lên màn hình chính |
| App nặng (từ điển của bộ chấm, dữ liệu) | Tải theo nhu cầu; đo bundle ở mỗi giai đoạn |
| Thư viện mới ra có lỗi (ts-fsrs 6.0.0 ra ngày 28/10/2026; Preact 11) | Khóa phiên bản; test kỹ; có phương án lùi về bản cũ |
| Không push được file CI (thiếu quyền workflow) | Báo lại; chủ dự án thêm file qua giao diện GitHub |
| Khối lượng nội dung lớn (1000 từ, 244 điểm ngữ pháp, khoảng 45 bài) | Làm và phát hành từng cấp; công cụ kiểm tra giúp soạn nhanh mà vẫn đúng |

## 11. Việc cần chủ dự án làm

- Duyệt kế hoạch này.
- Tìm giáo viên tiếng Trung để duyệt nội dung, bắt đầu với HSK1 (sau giai đoạn 3).
- Ở giai đoạn 7: bật GitHub Pages cho repo và đồng ý triển khai.
- Thử app trên điện thoại thật ở mỗi bản phát hành.

[syllabus]: https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf
[cts]: https://www.chinesetest.cn/HSK
[chisa]: http://www.chisa.edu.cn/general/202609/t20260909_2111519112.html
[gf0025]: http://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/W020210329527301787356.pdf
[lse]: https://www.lse.ac.uk/cibl/qualifications/secure/hsk
[ofou]: https://github.com/ofou/hsk
[hanviet]: https://github.com/ph0ngp/hanviet-pinyin-wordlist
[fsrs]: https://github.com/open-spaced-repetition/ts-fsrs
[hw]: https://github.com/chanind/hanzi-writer
[hwd]: https://github.com/chanind/hanzi-writer-data
