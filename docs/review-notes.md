# Ghi chú cho giáo viên duyệt nội dung

Toàn bộ nội dung khóa học hiện là **bản nháp do Claude soạn** (một phần do các agent Claude soạn song song). Danh sách dưới đây gom những điểm người soạn **chưa chắc chắn** và đề nghị giáo viên xem trước. Cách duyệt bằng bảng tính ở [content-guide.md](content-guide.md#5-giáo-viên-duyệt-bằng-bảng-tính).

## HSK1

### Từ vựng, nghĩa, cách đọc
- 一个电脑 / 一个手机 (bài 6): cách nói khẩu ngữ; lượng từ chuẩn là 台 và 部. Bảng danh từ của bộ chấm (`nouns.json`) gợi ý 部 trước cho 手机, còn khóa học dạy 个: cần thống nhất.
- 饭店 (bài 8): nghĩa đầu là "nhà hàng"; ở Trung Quốc đại lục 饭店 cũng thường là khách sạn.
- 谁: app dùng shéi (cách đọc thông dụng); đề cương ghi shéi/shuí.
- Năm viết 二零二六年 (bài 4) vì chữ 〇 không qua kiểm soát từ vựng; ghi chú của từ nói văn viết chuẩn dùng 〇.
- Pinyin sinh tự động: 边 trong 前边, 上边 đang mang thanh 1 (biān) thay vì thanh nhẹ; 觉 trong 睡一个小时觉 đã được sửa tay thành jiào. Nên rà pinyin của các câu ví dụ.
- 80 từ có nhiều âm Hán Việt (ví dụ 读 "đọc/độc", 路上 "lộ thướng"): app hiện dấu *; cần chọn âm đúng.

### Ngữ pháp và câu "sai" trong mục lỗi hay gặp
Một số câu được ghi là "sai" thật ra **đúng ngữ pháp nhưng sai ý định** hoặc chỉ kém tự nhiên. Ghi chú đã giải thích, nhưng cần giáo viên xác nhận cách trình bày:
- 我去上海坐火车 (bài 10): đúng ngữ pháp, nghĩa là "đến Thượng Hải để đi tàu".
- 我昨天不去医院 (bài 12): có thể hiểu là "không chịu đi".
- 今天天气有点儿好 (bài 11): 有点儿 trước tính từ tích cực, kém tự nhiên chứ không hẳn sai.
- 一件真漂亮的衣服 (bài 11): ghi là sai vì 真 không làm định ngữ trước 的.
- 我们是学生们, 她是第三学生, 我睡觉八个小时 (bài 2–5): sai về cách dùng hơn là ngữ pháp chặt.
- 在房间里有两只猫 (bài 7): dạy là sai; một số giáo viên chấp nhận trong khẩu ngữ.
- 他睡觉呢吗？, 我正在在家。 (bài 13): ghi là sai.
- 我家五口人。 (bài 3): câu khẩu ngữ (thiếu 有).
- 我妈妈起床很早, 他睡觉很晚 (bài 5): tính từ đứng sau 起床/睡觉 không có 得; cần xem độ tự nhiên.
- 睡一个小时觉 (bài 15): tách động từ ly hợp; so với 睡了一个小时.

### Cách chia điểm ngữ pháp
- Điểm 26 (吧1、了2、吗、呢1–3) dạy ở bài 10: cách đánh số 呢1/2/3 là cách hiểu của người soạn; 呢 tiếp diễn để sang bài 13, 了 biến đổi sang bài 11.
- Điểm 41 (động lượng bổ ngữ) chỉ dạy 一下, vì 次 thuộc HSK2.
- 没有 + động từ đã xuất hiện ở bài 8 trước khi điểm 20 (bài 12) dạy kỹ.
- 有些 (bài 15) mới dạy nghĩa đại từ, chưa dạy nghĩa "hơi" trước tính từ.
- Các hình vị được dạy kèm điểm ngữ pháp để dùng trong câu: 没 (điểm 20), 觉 (điểm 7), 杯 (điểm 13).

## Giới hạn của bộ chấm phát hiện khi soạn
- Loại `count`: câu 一天有二十四小时 không được chấm (小时 bị hiểu là lượng từ thời gian); bài đó dùng loại `model`.
- Loại `count`: danh từ đi sau một từ lạ (两个女医生) được nhận đúng nhưng gắn cờ "cần giáo viên xem lại".
- Một số lỗi kiểu tiếng Việt chưa có luật nên bị 0 điểm thay vì được giải thích: 我想说话和王老师, 我上班八点, 外边学校…, 这个衣服 (sai lượng từ sau 这).
- 他昨天没有来了 chỉ bị trừ 15 điểm (thừa 了).
