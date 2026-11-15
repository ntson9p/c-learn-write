# Bàn giao dự án c-learn-write

> **Đọc file này trước tiên.** Viết ngày 2026-11-14, khi chuyển dự án sang một phiên Claude Code mới (Cloud Session) sau khi repo được đưa lên GitHub. Phiên mới **không có bộ nhớ** của các phiên trước: mọi điều cần biết đều nằm trong file này, [README.md](../README.md) và [docs/design.md](design.md).

## 1. Tóm tắt

- **Là gì:** bộ chấm câu trả lời tự luận ngắn bằng tiếng Trung cho người học là **người Việt**. Bộ chấm **không dùng LLM/AI**, chỉ dùng luật ngôn ngữ. Nó viết bằng TypeScript, chạy được ngay trên trình duyệt hoặc Node.js, và đưa nhận xét bằng tiếng Việt.
- **Trạng thái:** prototype hoạt động tốt.
  - Có 3 loại câu hỏi: đếm số lượng, đáp án mẫu, hỏi nơi chốn.
  - Có 16 mã lỗi, kèm nhận xét và cách sửa.
  - Có 9 câu hỏi mẫu và một trang web demo.
  - 295 test đều qua; repo có 11 commit trên nhánh `master` (commit cuối cùng thêm chính tài liệu này).
- **Việc tiếp theo** (mục 10): xây một **web app hoàn chỉnh dạy ngữ pháp và từ vựng tiếng Trung**, giúp người học đạt trình độ từ **HSK1 đến HSK3**, dùng lại bộ chấm này cho các bài tập tự luận.

> **Cập nhật 2026-11-14 (phiên 2).** Giai đoạn 0 và 1 đã xong: môi trường cloud chạy Node 22.23.4, 295 test qua; chủ dự án đã chốt 12 quyết định và **duyệt kế hoạch [docs/plan.md](plan.md)** (đề cương thi HSK 2025, PWA Preact + Vite, monorepo npm workspaces, FSRS, nội dung do Claude soạn nháp và giáo viên duyệt…). Mọi việc làm trên nhánh `claude/gifted-euler-v75r1k`, không commit vào `master`; hỏi chủ dự án trước khi mở pull request, merge hoặc triển khai. Kế hoạch là nguồn chính cho các bước tiếp theo; các mục 9–11 bên dưới chỉ còn giá trị lịch sử.

## 1b. Tiến độ triển khai kế hoạch (cập nhật sau mỗi bước lớn)

Cập nhật lần cuối: 2026-11-15. Nhánh `claude/gifted-euler-v75r1k`; CI GitHub Actions (`.github/workflows/ci.yml`) chạy xanh. `npm run check`: 394 test.

| Giai đoạn | Trạng thái |
|---|---|
| 0–1. Tiếp nhận, khảo sát, quyết định | Xong; `docs/plan.md` đã được duyệt |
| 2. Nền tảng | Xong. Bộ chấm ở `packages/grader` (`@c-learn-write/grader`), nội dung ở `packages/course`, app PWA ở `apps/web` (Preact 10 + Vite 8, vite-plugin-pwa, idb, hash router, chuỗi tiếng Việt ở `apps/web/src/strings.ts`). `npm run e2e` = build + Playwright |
| 3. Dữ liệu | Xong cho HSK1. `packages/course`: nguồn khóa commit (`sources/`), dữ liệu đề cương (`data/hsk/`), chương trình (`data/curriculum.json`), 15 bài HSK1 (`data/lessons/hsk1/`), bộ kiểm tra (`src/validate.ts`), công cụ: `content:brief`, `content:fill`, `review:export`, `review:import`. Hướng dẫn: [content-guide.md](content-guide.md); điểm cần giáo viên xem: [review-notes.md](review-notes.md) |
| 4. Từ vựng | Xong: thẻ từ, FSRS (ts-fsrs 6.0.0), giọng đọc thiết bị, từ điển, sao lưu |
| 5. Ngữ pháp và bài tập | Xong cho HSK1: trang ngữ pháp, 6 dạng bài tập + bài tập từ vựng tự sinh; bộ chấm sửa 3 lỗi báo nhầm/chấm sai phát hiện khi soạn |
| 6. Kiểm tra và tiến độ | Xong: kiểm tra cuối bài (≥ 80% mở bài sau), kiểm tra cấp, trang tiến độ |
| 7. Phát hành HSK1 | Đang làm: workflow `deploy.yml` (chỉ chạy tay) đã có; còn README, rà khả năng truy cập/hiệu năng; **hỏi chủ dự án trước khi triển khai** |
| 8. HSK2 + luyện viết | Luyện viết (hanzi-writer, 250 chữ) xong; chương trình và nội dung HSK2 đang làm |
| 9. HSK3 | Chưa làm |

Lưu ý khi làm tiếp:
- Script Node trong `packages/course/scripts` chạy thẳng file `.ts` (Node 22.18+ tự bỏ kiểu); import tương đối phải ghi đuôi `.ts`.
- **Bộ lọc nội dung của Claude** đã hai lần chặn câu trả lời đúng lúc sắp viết ra bảng âm tiết pinyin chuẩn (có lẽ vì trùng văn bản phổ biến). Đừng gõ tay các danh sách chuẩn dài; hãy sinh chúng từ dữ liệu. Commit và push sau mỗi bước nhỏ vì tiến trình có thể bị khởi động lại.
- Không đưa câu ví dụ chính thức (例句) của đề cương vào repo.
- Soạn bài song song bằng agent: mỗi agent chỉ ghi file bài của mình, chạy `content:fill -- <bài>` và `CONTENT_FILTER=<bài> npx vitest run --project course`; người điều phối kiểm tra và commit. Khi commit lúc agent còn đang ghi, chạy `CONTENT_FILTER=<các bài sẽ commit> npm run check` và chỉ commit khi lệnh thoát thành công.

## 2. Làm việc với chủ dự án (quan trọng)

- Trả lời chủ dự án bằng **tiếng Việt**.
- Code, tên biến và commit message viết bằng **tiếng Anh**. Tài liệu của dự án (README, `docs/`) viết bằng **tiếng Việt**.
- Khi cần chủ dự án quyết định, hỏi bằng **câu hỏi trắc nghiệm** (công cụ AskUserQuestion):
  - phương án tốt nhất đứng đầu, gắn nhãn "(Khuyên dùng)";
  - mỗi phương án ghi rõ **ĐƯỢC / MẤT**, giải thích dễ hiểu;
  - tìm hiểu kỹ trước rồi mới hỏi, và chỉ hỏi những điều thực sự cần chủ dự án quyết;
  - mỗi lần hỏi tối đa 4 câu.
- Chủ dự án muốn mọi việc được làm **thật cẩn thận**:
  - kiểm tra kỹ và có test đầy đủ;
  - tự chạy thử với nhiều câu trả lời thực tế để tìm chỗ chấm sai;
  - báo cáo trung thực: cái gì đã kiểm chứng, cái gì chưa.
- **Ràng buộc gốc:** app không gọi LLM/AI khi chạy. Việc chấm điểm hoàn toàn bằng luật, tất định (cùng câu trả lời luôn ra cùng kết quả).
- Git:
  - commit theo từng bước có ý nghĩa, theo kiểu conventional commits (`feat(zh): …`, `docs: …`);
  - chạy `npm run check` trước mỗi commit;
  - hỏi chủ dự án trước khi push, mở pull request hoặc merge, trừ khi đã được cho phép.

## 3. Bài toán và cách tiếp cận

Ví dụ bài toán: câu hỏi 图片里有几个绿苹果？ (trong hình có 4 quả táo xanh). Câu trả lời 有四苹果。 được **80 điểm**, kèm nhận xét "thiếu lượng từ: nói 「四个苹果」".

Bộ chấm không cố "hiểu" ngôn ngữ một cách tổng quát. Câu hỏi đã có sẵn đáp án, nên việc của bộ chấm chỉ là **kiểm tra**:

```
Câu trả lời
  1. Chuẩn hóa       bỏ dấu cách, full-width → ASCII, phồn thể → giản thể (OpenCC)
  2. Phân tích       tìm "cụm số lượng" (四·个·绿·苹果) và "cụm nơi chốn" (在·书包·里)
  3. Chấm nội dung   nói đúng điều câu hỏi cần không? Sai → tối đa 20 điểm (cổng chặn)
  4. Bắt lỗi         mỗi lỗi ngôn ngữ bị trừ điểm, kèm nhận xét tiếng Việt + cách sửa
  5. Kết quả         điểm 0–100, nhận xét, câu đã sửa, đáp án gợi ý, cờ needsReview
```

Các nguyên tắc thiết kế (nên giữ khi phát triển tiếp):

1. **Chính xác trước, đầy đủ sau.** Khi không chắc, luật không báo lỗi. Với nội dung không chắc chắn, bộ chấm gắn cờ `needsReview` (cần giáo viên xem lại) thay vì đoán.
2. **Tất định.** Bộ chấm nhận từ bằng **từ vựng của dự án**, không dùng `Intl.Segmenter`, vì kết quả của nó có thể khác nhau giữa các trình duyệt.
3. **Dữ liệu là JSON** (trong `src/lang/zh/data/`), để giáo viên đọc và sửa được mà không cần đụng vào code.
4. **Câu hỏi là dữ liệu** (JSON trong `questions/`). Thêm câu hỏi mới không cần sửa code.
5. **Mỗi câu trả lời ví dụ trong file câu hỏi là một test tự động.** Ví dụ 100 điểm mà không ghi `issues` thì bắt buộc không được có lỗi nào.
6. **Ưu tiên các lỗi do thói quen tiếng Việt:** 苹果绿 → 绿苹果, 我吃饭在家 → 我在家吃饭, 在上桌子 → 在桌子上.

## 4. Những gì đã làm

### Lịch sử commit (nhánh `master`)

| Commit | Nội dung |
|---|---|
| `5ba2cc0` | Khung dự án: TypeScript strict, Vitest, Vite, quy ước xuống dòng LF |
| `c03fbee` | Phần lõi: kiểu dữ liệu, cú pháp đáp án `[a\|b](x)`, căn chỉnh có trọng số, áp dụng chỗ sửa, kiểm tra cấu hình câu hỏi |
| `8f014c7` | Nền tiếng Trung: chuẩn hóa, đọc số (四, 十四, 两千三, 四五…), từ vựng JSON, pinyin và chữ đồng âm |
| `fb74754` | Phân tích cụm số lượng và các luật lỗi (lượng từ, 二/两, trật tự tính từ, 不有…) |
| `6f7422d` | Bộ chấm loại `count` và `model`, 6 câu hỏi mẫu |
| `970872e` | Trang web demo (Vite, không framework) và test giao diện bằng happy-dom |
| `c79ab9a` | README và docs/design.md bằng tiếng Việt |
| `7bffe0c` | Sửa: xuống dòng tách mệnh đề, bỏ ký tự vô hình khỏi mã nguồn |
| `cbcca7d` | Loại câu hỏi `location` (在哪儿) và các luật về nơi chốn |
| `9638d7c` | Cập nhật tài liệu cho loại `location` |
| (cuối cùng) | Tài liệu bàn giao này (`docs/handoff.md`) |

### Ba loại câu hỏi

| Loại | Ví dụ | Cách chấm |
|---|---|---|
| `count` | 图片里有几个绿苹果？ | Tìm con số nói về đúng đối tượng và đúng màu. Xử lý được phủ định (没有四个), số ước lượng (四五个), nhiều con số mâu thuẫn, và trường hợp "không có" (没有绿苹果 = 0) |
| `model` | 这是什么？ | So với danh sách đáp án mẫu (cú pháp `[a\|b](x)`). Chấp nhận lỗi gõ đồng âm và thiếu/thừa hư từ (có trừ điểm); không bao giờ bỏ qua 不/没, con số hay 这/那. Khi cả câu không khớp thì thử từng mệnh đề |
| `location` | 书在哪儿？ / 你在哪儿吃饭？ | Câu hỏi theo hình: so khớp nơi chốn và phương vị từ (书包上 ≠ 书包里). Câu hỏi về bản thân: nơi nào cũng đúng, chỉ chấm ngôn ngữ |

### Mã lỗi và mức trừ điểm mặc định

| Mã | Ví dụ sai → đúng | Trừ |
|---|---|---|
| `missing_measure_word` | 四苹果 → 四个苹果 | 20 |
| `wrong_measure_word` | 四本苹果 → 四个苹果 | 20 |
| `er_liang` | 二个 → 两个 | 10 |
| `liang_misuse` | 十两 → 十二 | 10 |
| `modifier_order` | 苹果绿 → 绿苹果 | 20 |
| `bu_you` | 不有 → 没有 | 20 |
| `place_order` | 我吃饭在家 → 我在家吃饭; 放书在桌子上 → 把书放在桌子上 | 20 |
| `localizer_order` | 在上桌子 → 在桌子上 | 20 |
| `missing_localizer` | 在桌子 → 在桌子上 | 20 |
| `extra_localizer` | 在中国里 → 在中国 | 10 |
| `homophone_char` | 平果 → 苹果, 再家 → 在家 | 5 |
| `missing_word` / `extra_word` | 我越南人 → 我是越南人 (loại `model`) | 15 |
| `not_full_sentence` | (khi câu hỏi yêu cầu trả lời thành câu) | 20 |
| `arabic_digits` | 4个 → 四个 (khi câu hỏi yêu cầu chữ Hán) | 5 |
| `traditional_converted` | 蘋果 → 苹果 (chỉ ghi chú) | 0 |

Mỗi câu hỏi có thể đổi mức trừ qua trường `penalties`. Cách viết câu hỏi của từng loại có trong [README.md](../README.md#viết-câu-hỏi).

### Dữ liệu từ vựng (chưa được giáo viên duyệt)

| File | Nội dung |
|---|---|
| `nouns.json` | 123 danh từ và các lượng từ hợp với chúng |
| `measure-words.json` | 100 lượng từ, chia theo loại; danh sách `erOk` gồm những chỗ dùng 二 vẫn đúng |
| `modifiers.json` | 15 màu, 27 tính từ |
| `non-numbers.json` | Các từ chứa chữ số nhưng không phải số (一起, 星期四…) |
| `places.json` | 116 từ chỉ nơi chốn (34 tên riêng, 50 nơi chốn, 32 đồ vật kèm phương vị từ mặc định), 31 phương vị từ trong 12 nhóm, từ chỉ thời gian, các từ "không đảo" (上海, 上车…) |
| `verbs.json` | 91 động từ hành động, 23 động từ nhận 在 phía sau (住在, 放在…), 26 từ trông giống động từ nhưng không phải |

Checklist dữ liệu cần giáo viên duyệt nằm trong [docs/design.md](design.md#dữ-liệu-cần-giáo-viên-duyệt).

## 5. Cấu trúc thư mục

```
.editorconfig, .gitattributes   LF line endings, UTF-8
.gitignore                      node_modules/, dist/, coverage/…
package.json, package-lock.json scripts + dependencies (see section 6)
tsconfig.json                   strict, noUncheckedIndexedAccess, verbatimModuleSyntax, Bundler resolution
vite.config.ts                  demo: root demo/, build to dist/demo
vitest.config.ts                tests/**/*.test.ts, Node environment

src/
  index.ts                      public API: grade, validateQuestion, expandPattern, PatternError,
                                ZH_DEFAULT_PENALTIES, ZH_ISSUE_LABELS_VI, every type
  grade.ts                      grade(question, answer): switch on question.lang
  core/                         language independent
    types.ts                    Question (Count/Model/Location), GradeResult, Issue, Fix…
    patterns.ts                 expandPattern("[这|那](个)是苹果") → list of answers
    align.ts                    weighted edit-distance alignment (deterministic backtrace)
    fixes.ts                    applyFixes: insertions first, broad fixes win, position map
    scoring.ts                  clampScore, totalPenalty, resolvePenalties, sortIssues
    validate.ts                 validateQuestion(json) → list of errors
  lang/zh/                      Chinese pack
    index.ts                    gradeZh: switch on question.type
    normalize.ts                NFC, \p{Cf}, full-width, line breaks → "，", OpenCC t→s
    chars.ts                    isHan, isClauseBreak, isIgnorable…
    numbers.ts                  parseZhNumber, toZhNumeral, NUMERAL_RUN
    pinyin.ts                   readings, isHomophone, pinyinOf (pinyin-pro)
    spans.ts                    TextSpan, Typo, homophoneTypos, fixTypos
    lexicon.ts                  loads and validates data/*.json
    analyze.ts                  analyzeZh → ZhDoc { clauses, phrases (quantities), locations }
    places.ts                   location phrases (在 + place + localizer, 再 typo, 住河内…)
    rules.ts                    rules + ZhRuleContext; runZhRules
    location-rules.ts           place_order, localizer_order, missing/extra_localizer
    count.ts                    grader for "count"
    model.ts                    grader for "model" (unitize + alignment + clause matching)
    location.ts                 grader for "location"
    issues.ts                   issue codes, penalties, severities, Vietnamese labels, zhIssue()
    messages.ts                 every Vietnamese message for learners
    data/                       JSON word lists (section 4)

questions/
  index.ts                      QUESTIONS: loads questions/*/*.json (import.meta.glob)
  zh/01…09-*.json               9 sample questions with examples = regression tests

demo/                           demo page: index.html, main.ts, style.css, highlight.ts
tests/                          Vitest: core/, zh/, demo/ (happy-dom), questions.test.ts
docs/design.md                  design: decisions, algorithms, teacher checklist
docs/handoff.md                 this file
```

## 6. Chạy và kiểm tra

Yêu cầu Node.js **22.12 trở lên** (Vitest 5 cần `^22.12 || ^24 || >=26`). Dự án đã được thử trên Node 24.21 / Windows 11. Phiên cloud chạy Linux, nên cần kiểm tra `node --version` trước. Nếu Node cũ hơn thì cài Node 22 hoặc 24 (ví dụ qua nvm) trước khi chạy `npm ci`.

```sh
npm ci                 # cài đúng phiên bản trong package-lock.json
npm run check          # tsc --noEmit + vitest run → mong đợi 18 file test, 295 test qua
npm test               # chỉ chạy test
npm run demo           # trang demo: http://localhost:5173 (thêm -- --host để mở từ máy khác)
npm run demo:build     # build tĩnh vào dist/demo
```

Thư viện đang dùng:
- runtime: `pinyin-pro` ^3.29.5, `opencc-js` ^1.4.2;
- dev: `typescript` ^7.0.2 (bản native), `vite` ^8.3.8, `vitest` ^5.1.0, `happy-dom` ^21.0.4.

Cách dùng bộ chấm trong code:

```ts
import { grade, validateQuestion, type Question } from './src';
import data from './questions/zh/08-location-eat.json';

const question = data as Question;
validateQuestion(question); // [] nếu hợp lệ
const result = grade(question, '我吃饭在家。');
// result.score = 80, result.issues[0].code = 'place_order', result.corrected = '我在家吃饭。'
```

Hiệu năng: lần chấm đầu mất khoảng 0,2 giây (nạp từ điển pinyin và OpenCC), sau đó khoảng 0,3 ms mỗi câu trả lời. File JS của trang demo khoảng 461 KB (223 KB sau khi nén gzip), phần lớn là từ điển.

## 7. Lưu ý kỹ thuật (các bẫy đã gặp)

- **Ký tự vô hình:** khi ghi file bằng công cụ của Claude, chuỗi dạng `\uXXXX` trong tham số có thể bị giải mã thành ký tự thật. Một lần, ký tự U+2028 lọt vào regex và làm hỏng cú pháp. Trong mã nguồn, hãy dùng `\p{Cf}`, `\p{Zl}`, `\p{Zp}` hoặc `String.fromCharCode(0x…)`. Lệnh kiểm tra:
  `LC_ALL=C grep -rlP '\xe2\x80[\x8b-\x8f\xa8-\xae]|\xe2\x81[\xa0-\xaf]|\xef\xbb\xbf|\xe3\x80\x80' src tests demo questions` (kết quả mong đợi: rỗng). Phải có `LC_ALL=C` để grep so khớp theo byte; nếu thiếu, lệnh sẽ không bao giờ tìm thấy gì.
- **TypeScript 7 + `verbatimModuleSyntax`:** import kiểu dữ liệu phải viết `import type`. `rules.ts` gọi `location-rules.ts`, còn `location-rules.ts` chỉ `import type` ngược lại; nhờ vậy không có import vòng khi chạy.
- **Import JSON và `import.meta.glob`** cần bundler (Vite/Vitest), nên không chạy `src/` trực tiếp bằng `node` được. Web app tương lai nên import bộ chấm qua bundler.
- **Vị trí lỗi** (`start`, `end` của mỗi issue) tính trên `result.normalized` (chuỗi đã chuẩn hóa), theo đơn vị UTF-16.
- **`applyFixes`:** nếu nhiều chỗ sửa ở cùng vị trí thì chèn trước. Chỗ sửa bao trùm (như sửa trật tự từ) thắng chỗ sửa nằm bên trong nó, nên chỗ sửa bao trùm phải tự chứa sẵn nội dung đã sửa bên trong.
- **Loại `model`:** câu trả lời trùng y hệt một đáp án mẫu thì được tin tuyệt đối, không chạy luật.
- **Đồ vật đứng một mình** (椅子。) chỉ được coi là nơi chốn khi trả lời câu hỏi `location` (`analyzeZh(text, { locationQuestion: true })`). Nếu không có điều kiện này, câu 一把椅子 sẽ bị báo nhầm là thiếu phương vị từ.
- Bộ nhớ đệm toàn cục: converter OpenCC (tạo lần đầu khi cần), cách đọc pinyin của từng chữ, và danh sách đáp án đã mở rộng (`WeakMap` theo đối tượng câu hỏi).
- Mã nguồn dùng xuống dòng **LF** (do `.gitattributes` quy định), kể cả khi làm trên Windows.

## 8. Giới hạn hiện tại

- Toàn bộ dữ liệu từ vựng và các luật **chưa được giáo viên tiếng Trung duyệt**.
- `place_order` cố ý không báo lỗi khi câu có động từ chuyển động (我去学习在图书馆 → 我去图书馆学习). Chưa có luật cho cụm thời gian đặt sai chỗ (我吃饭在晚上).
- Chưa xử lý lượng từ khác nhau theo vùng miền (一只苹果 ở Thượng Hải).
- Chưa hỗ trợ trả lời bằng pinyin hay giọng nói. Câu hỏi mở (viết đoạn văn, hội thoại tự do) nằm ngoài khả năng chấm bằng luật.
- Chưa lưu lại câu trả lời của người học, chưa có tài khoản, chưa lưu tiến độ học.
- Chưa có gói tiếng Anh (chủ dự án dự định làm app tiếng Anh sau này, dùng chung phần `core`).

## 9. Ý tưởng mở rộng bộ chấm (đã ghi trong design.md)

1. Giáo viên duyệt dữ liệu; bổ sung danh từ, nơi chốn, động từ theo giáo trình.
2. Ghi lại câu trả lời thật. Giáo viên xem các câu có cờ `needsReview`, rồi bổ sung vào đáp án mẫu hoặc luật.
3. Thêm luật trật tự cho câu có động từ chuyển động và cho cụm thời gian.
4. Cho phép trả lời bằng pinyin và chấm thanh điệu.
5. Gói tiếng Anh (`src/lang/en`).

## 10. Mục tiêu tiếp theo: web app dạy tiếng Trung HSK1 → HSK3

**Mong muốn của chủ dự án:** tạo **một web app hoàn chỉnh để dạy ngữ pháp và từ vựng tiếng Trung**, giúp người học (người Việt) đạt trình độ từ **HSK1 đến HSK3**.

### Bộ chấm hiện có đóng vai trò gì

- Chấm các bài tập trả lời tự luận ngắn, có nhận xét tiếng Việt và câu đã sửa.
- Đã có sẵn luật cho các điểm ngữ pháp sơ cấp quan trọng: lượng từ, 二/两, 不/没有, trật tự tính từ, trật tự nơi chốn, phương vị từ.
- Mỗi điểm ngữ pháp mới có thể có thêm luật và loại câu hỏi riêng, theo đúng khuôn mẫu đã dùng cho `count` và `location`. Ví dụ các điểm ngữ pháp thường gặp ở trình độ sơ cấp: 是, 吗/呢, 的, 了, 过, 着, 在 + động từ, 会/能/想/要, cụm thời gian, 也/都, 比, 是…的, 把, 被, bổ ngữ kết quả và bổ ngữ xu hướng. Cấp độ cụ thể của từng điểm phải lấy theo giáo trình chính thức đã chọn.

### Phạm vi gợi ý cho "web app hoàn chỉnh" (cần thống nhất với chủ dự án)

- **Lộ trình học** theo cấp HSK1 → HSK3, chia thành bài, mỗi bài có từ vựng, ngữ pháp và bài tập.
- **Từ vựng:** chữ Hán, pinyin, nghĩa tiếng Việt, câu ví dụ, phát âm, và ôn tập ngắt quãng (spaced repetition).
- **Ngữ pháp:** giải thích bằng tiếng Việt, ví dụ đúng/sai, chỉ rõ các lỗi do thói quen tiếng Việt.
- **Bài tập:** trắc nghiệm, ghép cặp, sắp xếp từ thành câu (rất hợp để luyện trật tự từ), điền vào chỗ trống, và trả lời tự luận ngắn (do bộ chấm này chấm).
- Bài kiểm tra theo cấp độ, theo dõi tiến độ.
- Giao diện tiếng Việt, ưu tiên điện thoại, dùng được khi không có mạng nếu có thể.

### Các quyết định cần hỏi chủ dự án (tìm hiểu kỹ trước khi hỏi)

1. **Theo chuẩn HSK nào?**
   - HSK 2.0 (từ năm 2010): HSK1 150 từ, HSK2 300 từ, HSK3 600 từ (cộng dồn).
   - HSK 3.0: theo chuẩn GF 0025-2021 《国际中文教育中文水平等级标准》, có hiệu lực từ ngày 2021-07-01. Chuẩn này chia "ba bậc chín cấp" và dựa trên bốn yếu tố: âm tiết, chữ Hán, từ vựng, ngữ pháp. Số từ mỗi cấp nhiều hơn hẳn HSK 2.0.
   - Lúc viết tài liệu này, các nguồn **mâu thuẫn** nhau về số từ cụ thể của HSK 3.0 cấp 1–3 và về thời điểm kỳ thi HSK 3.0 chính thức thay thế HSK 2.0. Phải **kiểm tra từ nguồn chính thức** (văn bản chuẩn, trang của Chinese Testing International) trước khi chốt.
2. **Nguồn nội dung và giấy phép.**
   - Danh sách từ mở có sẵn: `drkameleon/complete-hsk-vocabulary` (ghi giấy phép MIT, có cả HSK 2.0 và 3.0; phần nghĩa lấy từ CC-CEDICT) và `ivankra/hsk30` (mã nguồn MIT; dữ liệu lấy từ các repo khác).
   - CC-CEDICT dùng giấy phép CC BY-SA 4.0, nên có thể phải ghi nguồn và chia sẻ cùng giấy phép. Phải đọc kỹ giấy phép trước khi dùng.
   - Nghĩa tiếng Việt, câu ví dụ, giải thích ngữ pháp do ai soạn? Gợi ý: Claude soạn nháp trong lúc phát triển, giáo viên duyệt. Phải xác nhận với chủ dự án rằng điều này không trái với ràng buộc "không AI": ràng buộc đó hiện chỉ áp dụng khi app chạy.
3. **Kiến trúc app:**
   - app chạy hoàn toàn phía trình duyệt (PWA, lưu tiến độ bằng IndexedDB/localStorage, không cần server), hay có tài khoản và server để đồng bộ?
   - chọn framework nào? (Dự án khác của chủ dự án, doctor-v, dùng Astro + Preact.)
4. **Cấu trúc repo:** monorepo với npm workspaces (`packages/engine` cho bộ chấm hiện tại, `apps/web` cho app), hay đặt app ngay trong package hiện tại.
5. **Âm thanh:** Web Speech API (miễn phí, nhưng giọng zh-CN phụ thuộc thiết bị), audio thu sẵn (tốn chi phí, phải xét bản quyền), hay chưa làm ở bước đầu.
6. **Thuật toán ôn tập ngắt quãng:** FSRS hay SM-2 (có thư viện mã nguồn mở; kiểm tra giấy phép).
7. **Luyện viết chữ Hán** (ví dụ thư viện hanzi-writer với dữ liệu Make Me a Hanzi; kiểm tra giấy phép dữ liệu): làm ngay hay để sau?
8. **Giấy phép mã nguồn** của repo khi đưa lên GitHub, và repo để công khai hay riêng tư.
9. **Quy trình giáo viên duyệt nội dung:** có giáo viên chưa, duyệt theo cách nào.

### Các giai đoạn gợi ý (phải được chủ dự án duyệt thành `docs/plan.md`)

| Giai đoạn | Nội dung | Kết quả cần đạt |
|---|---|---|
| 0. Tiếp nhận | Đọc tài liệu, `npm ci`, `npm run check` | 295 test qua; báo cáo môi trường |
| 1. Khảo sát và quyết định | Tìm hiểu chuẩn HSK chính thức, các bộ dữ liệu và giấy phép; hỏi các quyết định ở trên | `docs/plan.md` được chủ dự án duyệt |
| 2. Nền tảng | Sắp xếp lại repo theo cấu trúc đã chọn; CI trên GitHub Actions chạy `npm run check`; khung app (điều hướng, bố cục, tiếng Việt, ưu tiên điện thoại) | App chạy được, bộ chấm được dùng như một thư viện, test vẫn qua |
| 3. Dữ liệu | Định dạng JSON cho từ, điểm ngữ pháp, bài học, bài tập, kèm test kiểm tra; script nhập danh sách HSK (ghi nguồn, giấy phép) | Dữ liệu HSK1 nhập được và qua kiểm tra |
| 4. Từ vựng | Thẻ từ, ôn tập ngắt quãng, phát âm, lưu tiến độ | Học trọn từ vựng HSK1 |
| 5. Ngữ pháp và bài tập | Bài giảng ngữ pháp; các dạng bài tập; thêm luật và loại câu hỏi cho bộ chấm theo từng điểm ngữ pháp | Hoàn thành các bài HSK1 |
| 6. Kiểm tra và tiến độ | Bài kiểm tra theo cấp, bảng tiến độ | |
| 7. Mở rộng và hoàn thiện | Nội dung HSK2, rồi HSK3 (giáo viên duyệt); khả năng truy cập, hiệu năng, dùng được khi mất mạng; triển khai | Phát hành |

## 11. Nguồn tham khảo về HSK (để kiểm tra lại)

- HSK 3.0, các thay đổi và lịch áp dụng: <https://hsklord.com/blog/hsk-3-0-changes-2026>, <https://studycli.org/hsk/the-new-hsk>, <https://www.thatsmandarin.com/hsk/hsk-3-0-2026-update-what-chinese-learners-need-to-know/>. Đây là nguồn bên thứ ba, cần đối chiếu với thông báo chính thức của Chinese Testing International.
- Danh sách từ mở: <https://awesome.ecosyste.ms/projects/github.com%2Fdrkameleon%2Fcomplete-hsk-vocabulary>, <https://awesome.ecosyste.ms/projects/github.com%2Fivankra%2Fhsk30>.
