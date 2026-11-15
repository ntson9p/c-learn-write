# Học tiếng Trung HSK (c-learn-write)

Web app giúp **người Việt** học từ vựng và ngữ pháp tiếng Trung từ con số 0 tới **HSK3**, theo **đề cương thi HSK mới (2025)**. Bài tự luận được chấm bằng **luật ngôn ngữ, không dùng AI**: cùng một câu trả lời luôn cho cùng một kết quả, kèm nhận xét tiếng Việt và câu đã sửa.

> **Trạng thái:** đã có đủ nội dung HSK1–HSK3 theo đề cương: 45 bài, 1000 từ, 244 điểm ngữ pháp, 1238 bài tập soạn sẵn (cộng bài tập từ vựng tự sinh).
>
> | Cấp | Bài | Từ | Điểm ngữ pháp | Bài tập |
> |---|---|---|---|---|
> | HSK1 | 15 | 300 | 70 | 361 |
> | HSK2 | 10 | 200 | 78 | 301 |
> | HSK3 | 20 | 500 | 96 | 576 |
>
> Toàn bộ nội dung là **bản nháp do Claude soạn, chưa được giáo viên duyệt**; app hiện nhãn "Chưa duyệt" trên từng mục. Xem [docs/review-notes.md](docs/review-notes.md).

## Ứng dụng có gì

- **Lộ trình học** HSK1 → HSK3 theo chủ đề của đề cương. Mỗi bài gồm từ mới, ngữ pháp, bài tập và bài kiểm tra; bài sau mở khi bài trước đạt 80% (hoặc chọn "học vượt").
- **Từ vựng:** chữ Hán, pinyin, âm Hán Việt, nghĩa, ghi chú, câu ví dụ có pinyin trên từng chữ, nghe bằng giọng đọc của thiết bị; **ôn tập ngắt quãng FSRS**; từ điển tra theo chữ Hán, pinyin (có hoặc không dấu), nghĩa hoặc âm Hán Việt.
- **Ngữ pháp:** giải thích bằng tiếng Việt, mẫu câu, ví dụ, lỗi hay gặp của người Việt.
- **Bài tập:** trắc nghiệm, nghe và chọn, điền từ, sắp xếp câu (sai thì bộ chấm giải thích, ví dụ 我吃饭在家 → 「在 + nơi chốn」 đứng trước động từ), dịch Việt → Trung, trả lời câu hỏi (bộ chấm chấm và sửa), nối cặp.
- **Kiểm tra** cuối bài và theo cấp; **trang tiến độ** (chuỗi ngày học, số từ đã nhớ, điểm ngữ pháp nên ôn).
- **Luyện viết** 250 chữ viết tay của HSK2–3 (thứ tự nét, tập viết).
- **PWA:** cài được như app, **dùng được khi mất mạng**, tiến độ chỉ lưu trên máy (có sao lưu/khôi phục bằng file), không quảng cáo, không thu thập dữ liệu.

## Chạy thử

Yêu cầu: Node.js 22.12 trở lên (đã thử với Node 22.23 và 24.21).

```sh
npm ci
npm run dev       # web app: mở địa chỉ Vite in ra (thêm -- --host để mở từ điện thoại cùng mạng Wi-Fi)
npm run check     # kiểm tra kiểu TypeScript + toàn bộ test (bộ chấm, nội dung khóa học, app)
npm run build     # build web app (PWA) vào apps/web/dist
npm run e2e       # build rồi chạy test đầu-cuối bằng Playwright (Chromium)
npm run demo      # trang demo riêng của bộ chấm
```

Triển khai lên GitHub Pages: bật Pages (Settings → Pages → Source: GitHub Actions), rồi chạy tay workflow **Deploy to GitHub Pages** ở tab Actions.

## Cấu trúc

```
packages/grader/   bộ chấm câu trả lời tự luận (TypeScript thuần, không AI) — xem packages/grader/README.md
packages/course/   nội dung khóa học (JSON, CC BY-SA 4.0): đề cương HSK 2025, chương trình, bài học, bài tập,
                   bộ kiểm tra nội dung, công cụ soạn và duyệt — xem docs/content-guide.md
apps/web/          web app PWA (Preact + Vite)
docs/              plan.md (kế hoạch), handoff.md (bàn giao, tiến độ), design.md (thiết kế bộ chấm),
                   content-guide.md (soạn và duyệt nội dung), review-notes.md (điểm cần giáo viên xem)
```

## Nội dung và giáo viên duyệt

Nội dung là file JSON trong `packages/course/data/`. Mỗi lần chạy `npm run check`, test kiểm tra toàn bộ nội dung: đủ từ và ngữ pháp của đề cương, câu chỉ dùng từ đã học (kiểm soát từ vựng), pinyin khớp từng chữ, đáp án bài tập nhất quán, và không câu đúng nào bị luật của bộ chấm báo nhầm.

Giáo viên duyệt bằng bảng tính (Excel, Google Sheets), không cần biết JSON:

```sh
npm run review:export -w @c-learn-write/course -- duyet-hsk1.csv hsk1   # xuất
npm run review:import -w @c-learn-write/course -- duyet-hsk1.csv        # nhập kết quả duyệt
```

Chi tiết: [docs/content-guide.md](docs/content-guide.md).

## Giấy phép

- Mã nguồn: [MIT](LICENSE).
- Nội dung khóa học do dự án soạn: [CC BY-SA 4.0](packages/course/LICENSE).
- Dữ liệu và thư viện bên thứ ba (đề cương HSK 2025 qua ofou/hsk, âm Hán Việt, dữ liệu nét chữ Make Me a Hanzi…): [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
