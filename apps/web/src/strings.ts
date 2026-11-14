/**
 * Every Vietnamese string of the user interface, in one place so that it can
 * be reviewed and changed without reading the components.
 */
export const T = {
  appName: 'Học tiếng Trung HSK',
  appTagline: 'Từ vựng và ngữ pháp HSK1–HSK3 cho người Việt',
  skipToContent: 'Bỏ qua, tới nội dung chính',
  loading: 'Đang tải…',
  loadFailed: 'Không tải được trang này. Nếu bạn đang offline, hãy mở lại khi có mạng một lần để ứng dụng lưu sẵn.',
  retry: 'Thử lại',
  notFound: 'Không tìm thấy trang này.',
  backHome: 'Về trang chính',
  back: 'Quay lại',
  draftBadge: 'Chưa duyệt',
  draftHint: 'Nội dung này là bản nháp, chưa được giáo viên duyệt.',

  nav: {
    label: 'Điều hướng chính',
    learn: 'Học',
    review: 'Ôn tập',
    dict: 'Từ điển',
    progress: 'Tiến độ',
    settings: 'Cài đặt',
  },

  home: {
    title: 'Lộ trình học',
    intro: 'Học từ con số 0 tới HSK3 theo đề cương thi HSK mới (2025): mỗi bài có từ mới, ngữ pháp và bài tập.',
    levelWords: (n: number) => `${n} từ mới`,
    levelGrammar: (n: number) => `${n} điểm ngữ pháp`,
    comingSoon: 'Nội dung của cấp này đang được soạn.',
  },

  review: { title: 'Ôn tập', empty: 'Chưa có từ nào để ôn. Hãy học bài đầu tiên.' },
  dict: { title: 'Từ điển' },
  progress: { title: 'Tiến độ' },

  settings: {
    title: 'Cài đặt',
    display: 'Hiển thị',
    theme: 'Giao diện',
    themeAuto: 'Theo máy',
    themeLight: 'Sáng',
    themeDark: 'Tối',
    showPinyin: 'Hiện pinyin trong câu ví dụ',
    showHanViet: 'Hiện âm Hán Việt',
    study: 'Học tập',
    newWordsPerDay: 'Số từ mới mỗi ngày',
    data: 'Dữ liệu của bạn',
    dataIntro:
      'Tiến độ học chỉ được lưu trên máy này, không gửi đi đâu. Hãy tải file sao lưu thường xuyên; muốn chuyển sang máy khác thì mở file đó trên máy mới.',
    lastBackup: (date: string | null) => (date ? `Lần sao lưu gần nhất: ${date}.` : 'Bạn chưa sao lưu lần nào.'),
    exportBackup: 'Tải file sao lưu',
    importBackup: 'Khôi phục từ file sao lưu',
    importConfirm: 'Khôi phục sẽ thay toàn bộ tiến độ hiện tại bằng dữ liệu trong file. Tiếp tục?',
    importDone: 'Đã khôi phục dữ liệu.',
    importFailed: 'Không khôi phục được:',
    persistent: 'Trình duyệt đã đồng ý giữ dữ liệu lâu dài.',
    notPersistent: 'Trình duyệt có thể tự xóa dữ liệu khi máy thiếu bộ nhớ.',
    askPersistent: 'Xin giữ dữ liệu lâu dài',
    iosHint: 'Trên iPhone/iPad, hãy dùng "Thêm vào màn hình chính" trong Safari để dữ liệu không bị xóa khi lâu không mở.',
    clearAll: 'Xóa toàn bộ dữ liệu',
    clearConfirm: 'Xóa toàn bộ tiến độ học trên máy này? Không thể hoàn tác.',
    cleared: 'Đã xóa toàn bộ dữ liệu.',
    tools: 'Công cụ và thông tin',
    graderLink: 'Chấm thử câu trả lời',
    aboutLink: 'Giới thiệu và giấy phép',
  },

  grader: {
    title: 'Chấm thử câu trả lời',
    intro: 'Chọn một câu hỏi, gõ câu trả lời bằng chữ Hán rồi bấm "Chấm điểm". Bộ chấm dùng luật, không dùng AI.',
    questions: 'Câu hỏi mẫu',
    answerLabel: 'Câu trả lời',
    placeholder: 'Nhập câu trả lời bằng chữ Hán…',
    submit: 'Chấm điểm',
    tryExamples: 'Thử nhanh',
    expected: (score: number, same: boolean, got: number) =>
      `Điểm mong đợi trong bộ ví dụ: ${score} ${same ? '✓' : `≠ ${got}`}`,
  },

  result: {
    status: {
      correct: 'Đúng nội dung',
      wrong: 'Sai nội dung',
      no_answer: 'Chưa trả lời',
      unmatched: 'Chưa khớp đáp án',
    },
    needsReview: 'Bộ chấm chưa chắc chắn: kết quả này cần giáo viên xem lại.',
    yourAnswer: 'Câu trả lời',
    feedback: 'Nhận xét',
    corrected: 'Câu đã sửa:',
    suggestion: 'Đáp án tham khảo:',
    scoreLabel: (score: number) => `${score} trên 100 điểm`,
  },

  about: {
    title: 'Giới thiệu và giấy phép',
    intro:
      'Ứng dụng giúp người Việt học từ vựng và ngữ pháp tiếng Trung từ HSK1 đến HSK3, theo đề cương thi HSK mới (2025). Ứng dụng chạy hoàn toàn trên máy của bạn và dùng được khi không có mạng.',
    principlesTitle: 'Nguyên tắc',
    principles: [
      'Không dùng AI khi chấm bài: mọi bài đều được chấm bằng luật, cùng một câu trả lời luôn cho cùng một kết quả.',
      'Không thu thập dữ liệu: không có quảng cáo, không có thống kê, tiến độ chỉ nằm trên máy của bạn.',
      'Nội dung do Claude (một mô hình AI) soạn nháp trong lúc phát triển và đang chờ giáo viên duyệt; mục nào chưa duyệt đều có nhãn "Chưa duyệt".',
      'Giọng đọc là giọng có sẵn của thiết bị. Một số giọng đọc của hệ điều hành cần mạng; khi đó văn bản cần đọc được gửi tới dịch vụ giọng nói của hệ điều hành.',
    ],
    sourcesTitle: 'Nguồn dữ liệu',
    licensesTitle: 'Giấy phép',
    codeLicense: 'Mã nguồn: giấy phép MIT.',
    contentLicense: 'Nội dung khóa học do dự án soạn: giấy phép CC BY-SA 4.0 (được chia sẻ, chỉnh sửa, kể cả mục đích thương mại, với điều kiện ghi nguồn và chia sẻ cùng giấy phép).',
    thirdParty: 'Giấy phép của các thư viện trong ứng dụng',
    thirdPartyMissing: 'Danh sách giấy phép chỉ có trong bản build (npm run build).',
    sourceCode: 'Mã nguồn',
  },
} as const;
