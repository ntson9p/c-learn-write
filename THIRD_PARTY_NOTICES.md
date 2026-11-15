# Thông báo giấy phép của bên thứ ba

Mã nguồn của dự án theo giấy phép MIT ([LICENSE](LICENSE)). Nội dung khóa học do dự án tự soạn (thư mục `packages/course/data`) theo giấy phép CC BY-SA 4.0 ([packages/course/LICENSE](packages/course/LICENSE)).

Dự án dùng các thành phần sau của bên thứ ba. Văn bản giấy phép đầy đủ của các thư viện được đóng gói vào app nằm trong file `licenses.txt` của bản build (trang "Giới thiệu và giấy phép" của app).

## Thư viện chạy trong app

| Thành phần | Phiên bản | Giấy phép | Bản quyền / nguồn |
|---|---|---|---|
| pinyin-pro | 3.29.x | MIT | Copyright (c) 2022-present zh-lx, <https://github.com/zh-lx/pinyin-pro> |
| opencc-js | 1.4.x | MIT; dữ liệu từ điển (opencc-data) theo Apache-2.0 | Copyright (c) 2020-2021 The nk2028 Project, <https://github.com/nk2028/opencc-js>; dữ liệu: <https://github.com/nk2028/opencc-data> |
| preact | 10.29.8 | MIT | Copyright (c) 2015-present Jason Miller, <https://github.com/preactjs/preact> |
| @preact/signals, @preact/signals-core | 2.11.4, 1.14.x | MIT | Copyright (c) 2022-present Preact Team |
| ts-fsrs | 6.0.0 | MIT | Copyright (c) 2026 Open Spaced Repetition, <https://github.com/open-spaced-repetition/ts-fsrs> |
| @open-spaced-repetition/srs-kit | 1.0.0 | BSD-3-Clause | Copyright (c) 2026, Open Spaced Repetition contributors |
| idb | 8.0.4 | ISC | Copyright (c) 2016, Jake Archibald |
| workbox (window, core, precaching, routing, strategies) | 7.4.x | MIT | Copyright 2018 Google LLC |

Văn bản đầy đủ của các giấy phép trên được build plugin `apps/web/build/licenses.ts` gom vào `licenses.txt`.

## Dữ liệu

| Dữ liệu | Dùng để | Giấy phép | Nguồn |
|---|---|---|---|
| Đề cương thi 《中文水平考试 HSK 考试大纲》 (2025) | Danh sách từ, chữ và điểm ngữ pháp HSK1–3 (không lấy câu ví dụ) | Không kèm giấy phép; danh sách được coi là dữ kiện. Nguồn: 中外语言交流合作中心 (CLEC), <https://www.chinesetest.cn/HSK> | Bản chép máy đọc được: <https://github.com/ofou/hsk>, MIT, "Copyright (c) 2021 Shawky" (`packages/course/sources/hsk-2025/`) |
| Âm Hán Việt | Âm Hán Việt của từng chữ trong từ vựng HSK1–3 | MIT, "Copyright (c) 2024 Phong Phan" | <https://github.com/ph0ngp/hanviet-pinyin-wordlist> (`packages/course/sources/hanviet/`) |
| pinyin-pro (dữ liệu) | Pinyin của câu ví dụ (sinh lúc soạn, ghi vào JSON) và các cách đọc dùng để kiểm tra pinyin | MIT | xem bảng trên |

