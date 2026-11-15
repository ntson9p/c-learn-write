# Ghi chú cho giáo viên duyệt nội dung

Toàn bộ nội dung khóa học (45 bài HSK1–3) hiện là **bản nháp do Claude soạn** (nhiều bài do các agent Claude soạn song song; mỗi bài đều qua bộ kiểm tra nội dung trước khi commit). Danh sách dưới đây gom những điểm người soạn **chưa chắc chắn** và đề nghị giáo viên xem trước. Cách duyệt bằng bảng tính ở [content-guide.md](content-guide.md#5-giáo-viên-duyệt-bằng-bảng-tính).

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

## HSK2

- **Cách hiểu các nghĩa con trong đề cương** (người soạn tự hiểu): điểm 90 (都2 = "đã … rồi", 就2 = "chính là", 还是1 = "vẫn"), điểm 103 (吧2 đoán và xác nhận, 呢4 nhấn mạnh sự thật, 的2 khẳng định chắc chắn, 啊1 cảm xúc).
- **Hình vị khai báo thêm:** 泳, 步 (điểm 75, để tách 游泳, 跑步: 游了一个小时泳, 跑完步); các dạng AABB 高高兴兴, 快快乐乐, 漂漂亮亮, 舒舒服服 (điểm 79, vì nội dung đề cương "AA、AABB" không có chữ Hán cụ thể).
- 常 (điểm 87) là từ HSK3 nên câu HSK2 chỉ dùng 经常; 常 chỉ nhắc trong phần giải thích.
- **Câu "sai" cần xác nhận:** 我们上课从八点到十一点, 我一个星期两次去超市, 我找了两次他, 我告诉给你一件事, 虽然下雨了，我们去上课了 (thiếu 但是), 我是一位老师 (位 cho bản thân), ——所以你喝咖啡吧 (所以 để đáp lời người khác); một số người chấp nhận trong khẩu ngữ: 他跑很快, 这个酒店是新, 我去学校坐地铁 (ghi chú nói rõ chỉ sai với ý định).
- **Độ tự nhiên:** 我妻子河内人, 明天我生日 (điểm 116), 一包饺子, 走路有十分钟, 他是高个子, 门口开着很多红色的花, 一间房间, 我也想买那样的一个书包; 一条狗 được trình bày là chấp nhận được; ghi chú văn hóa 一楼 / tầng trệt.
- Pinyin đã sửa tay: 教 jiāo (động từ), thanh nhẹ trong 看看, 想想, 帮个忙; 得/地/过 làm trợ từ đọc de/de/guo.

## HSK3

### Bài 01–08

- **Cách hiểu nghĩa con:** 才1 "muộn/chậm, mới", 就3 "chỉ" (就我一个人), 还3 chỉ mức độ (还不错, A比B还…), 有些 "hơi", 极 trước tính từ (极少; 极了 để sau).
- **Hình vị khai báo thêm:** 盘 (điểm 161, vì chỉ có từ 盘子), 不必 (điểm 171).
- **Câu "sai" chỉ sai ý định hoặc kém tự nhiên** (ghi chú đã nói rõ): 他可是每天都来, 这件衣服有点儿漂亮, 我跟他一样很高, 别人们, 十七十八岁 (viết 十七、十八岁 thì được), 你想吃什么？ (điểm 157), 他明天一定不来, 我愿意吃冰激凌, 明天我不得上班, 你不用喝酒, 东边学校.
- **Chưa chắc là sai:** 这家饭馆又便宜，而且好吃 (trộn hai cấu trúc), 这个蛋糕极好吃了, 在楼上搬来了…, 楼上搬来了那位邻居, 我家在学校北方; khẳng định 不A不B có trật tự cố định; khác biệt sắc thái 大概 / 差不多.
- Một số câu hỏi `model` cho 80 điểm khi câu trả lời đúng nhưng không dùng cấu trúc đang luyện (我很饿, 打扫干净了, 我感冒了).
- Ghi chú về 层 so sánh cách đánh số tầng ở Trung Quốc với miền Bắc và miền Nam Việt Nam; ghi chú 屋子 là từ của miền Bắc Trung Quốc.

### Bài 09–12

- **Cách hiểu nghĩa con:** điểm 181 (动补短语2) được hiểu là bổ ngữ kết quả bằng tính từ hoặc động từ (看清楚, 听明白, 写对). 为你高兴 xếp vào 为1 (điểm 172), không phải 为2 (điểm 174).
- **Không khai báo hình vị:** dạng tách của 生气 (生我的气, 生什么气) không qua kiểm soát từ vựng vì 生 và 气 đứng riêng không có trong đề cương. Các dạng này chỉ xuất hiện trong ghi chú tiếng Việt; bài tập dùng 担心什么.
- **Câu "sai" còn bàn được:** 我看来他生病了, 他不是会生气的, 你不是喜欢吃饺子呢？, 他学习很努力为了考上大学 (một số người chấp nhận 为了 ở cuối câu), 我把一本书送给她了, 你生气什么啊 (ghi chú nói 什么 phải chen vào giữa: 生什么气). Câu 老师，您哭什么啊 đúng ngữ pháp; ghi chú chỉ nói là thiếu lễ phép.
- **Độ tự nhiên:** 可以向老师问, 我把课文读了三遍.
- Pinyin đã sửa tay: 得 (de/děi), 还 huán (trả), 地 de, 过 guo; trong bổ ngữ khả năng 不 ghi bù (看不懂).

### Bài 13–16

- **Cách hiểu nghĩa con (người soạn tự đoán):** 才2, 才3 và 就4 (điểm 170): 才 + số lượng là "mới (có)…, chỉ" (才八点); 才 nhấn mạnh hoặc bác lại (这才是…, 我才不…呢); 就 thể hiện ý chí cứng rắn (我就要 / 我就不).
- **Hình vị khai báo thêm:** 成 (điểm 154, có trong nội dung chính thức qua 完成), để viết 完不成 / 完得成.
- **Câu "sai" chỉ sai ý định** (ghi chú đã nói rõ): 太远了，我不能看见, 我们先开会，以后一起去吃饭. **Có thể quá khắt khe:** 一般来说，昨天的会议… (chỉ sai về nghĩa), 外面下起来雨了 (nghe thấy trong khẩu ngữ).
- **Chấm khi thiếu cấu trúc đang luyện:** câu dịch yêu cầu 被, 得很 hoặc 一……也 cho 80 điểm nếu câu trả lời đúng nhưng không dùng cấu trúc đó (giống bài 06).
- **Giới hạn từ vựng:** 假 đứng riêng và 棵 không có trong đề cương, nên bài không tách 请假 thành 请半天假 và không dùng 一棵树; 张 đến bài 17 mới dạy nên không có 一张卡; 份 không có trong đề cương nên câu đếm dùng 银行 (家) và 伞 (把) thay vì 报纸.
- Pinyin đã sửa tay: 得 (de/děi), 只 zhǐ, 没 méi, 过 guo.

### Bài 17–20

- **Hình vị khai báo thêm:** 所 (điểm 160, cho 一所学校); 结, 婚, 澡, 假 (điểm 153, cho 结了婚, 结过婚, 洗了个澡, 放了三天假). Bốn chữ này có trong nội dung chính thức của điểm 153. Hệ quả: từ bài này về sau, các chữ đó qua được kiểm soát từ vựng.
- **Đáp án cần xác nhận:** bài 19, câu "Đối với tôi, gia đình…" nhận cả 在我看来… với điểm tối đa; câu "Theo bố tôi…" trả lời bằng 对爸爸来说… được 60 điểm.
- **Câu "sai" dựa trên sắc thái hoặc văn phong:** 我们等了不一会儿, 你说下来吧 (bài 18); 都十点了，看上去他不来了 (bài 17, ghi chú nói là kém tự nhiên chứ không sai ngữ pháp); 他是一名运动家, 我买了一张桌 (bài 19).
- **Cần xem:** phân biệt 看起来 / 看上去 (chỉ 看上去 giới hạn ở vẻ bề ngoài nhìn thấy); lượng từ 两头牛 / 三只牛 (theo bảng danh từ của bộ chấm) và 只 cho 羊. Bài 17 tránh 看起来像 vì 像 đến bài 18 mới dạy.
- Pinyin đã sửa tay: 得 trợ từ (跑得快, 跳得很高, 发展得) đọc de; 得多运动 đọc děi; 长得 zhǎng; 放假 jià.

## Giới hạn của bộ chấm phát hiện khi soạn HSK2–3

- Lỗi trật tự kiểu tiếng Việt với 从, 跟, 给, 一起, 最, 次 chưa có luật (bị 0 điểm thay vì được giải thích); thiếu 得 (他跑很快) cũng vậy.
- 在左边桌子, 在下面床, 在旁边教室 (phương vị từ hai âm tiết đứng trước danh từ) chưa bị bắt là `localizer_order`.
- 地铁站在学校 khi hình là "trước cổng trường": nay vẫn được chấm đúng nội dung nhưng gắn cờ "cần giáo viên xem lại" (bỏ phương vị từ chỉ hướng như 前, 后, 旁边 làm đổi nơi chốn).
- 三米饭 bị đọc là "3 mét"; 三个碗米饭 bị coi là sai nội dung; 面条儿, 药店 chưa có trong bảng từ của bộ chấm; 笔 chỉ nhận 支/枝 (题 nay nhận cả 个).
- Trợ từ 了 đặt sai chỗ chỉ bị trừ 30 điểm (thừa + thiếu từ).
- Lượng từ 口 ngoài câu hỏi đếm không còn bị kiểm tra, vì 一口 còn nghĩa là "một ngụm, một miếng" (喝了一口茶). Trong câu hỏi đếm, 两口咖啡 khi hình là hai cốc vẫn bị sửa thành 杯.
- 在手机看书 (thiếu 上) chưa bị bắt: 手机 và 电脑 chưa có trong danh sách đồ vật cần phương vị từ.
- Đã sửa trong lúc soạn HSK3 (mỗi lỗi có test): 运动员在体育馆里 bị báo sai trật tự; 喝了一口茶 bị báo sai lượng từ; 在手机上 bị đọc thành 在手 + 机上.
