

import { Guest, GuestGroup, AttendanceProbability, BudgetItem, TaskStatus, UserProfile, InvitationData, TimelinePhase } from '../types';

// Centralized admin contact info — single source of truth
export const ADMIN_CONTACT = {
  phone: '0343019101',
  email: 'danghoang.sqtt@gmail.com',
  get text() { return `${this.phone} hoặc ${this.email}`; },
  get activationWarning() { return `Tài khoản chưa kích hoạt. Liên hệ Admin: ${this.text}`; },
};

export const INITIAL_GUESTS: Guest[] = [
  { id: '1', name: 'Nguyễn Văn A', group: GuestGroup.GROOM, address: 'Hà Nội', probability: AttendanceProbability.CONFIRMED, childrenCount: 2, redEnvelope: 1000000 },
  { id: '2', name: 'Trần Thị B', group: GuestGroup.BRIDE, address: 'TP. Hồ Chí Minh', probability: AttendanceProbability.LIKELY, childrenCount: 0, redEnvelope: 500000 },
];

export const INITIAL_BUDGET_ITEMS: BudgetItem[] = [
  // --- 1. CHUẨN BỊ ĐÁM CƯỚI (Pre-Wedding) ---
  // Trang phục & Làm đẹp
  { id: 'pre-1', category: 'Trang Phục & Làm Đẹp', itemName: 'Váy cưới cô dâu (Thuê/May)', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Váy đi bàn + Váy làm lễ', phaseId: TimelinePhase.P_3M },
  { id: 'pre-2', category: 'Trang Phục & Làm Đẹp', itemName: 'Comple (Vest) chú rể', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 4000000, actualCost: 0, note: 'May đo hoặc mua sẵn', phaseId: TimelinePhase.P_3M },
  { id: 'pre-3', category: 'Trang Phục & Làm Đẹp', itemName: 'Giày cưới cô dâu', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: 'Cao gót thoải mái', phaseId: TimelinePhase.P_1M },
  { id: 'pre-4', category: 'Trang Phục & Làm Đẹp', itemName: 'Giày tây chú rể', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'pre-5', category: 'Trang Phục & Làm Đẹp', itemName: 'Cravat / Nơ chú rể', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 300000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'pre-6', category: 'Trang Phục & Làm Đẹp', itemName: 'Áo dài mẹ cô dâu & mẹ chú rể', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: 'Thuê hoặc may', phaseId: TimelinePhase.P_1M },
  { id: 'pre-7', category: 'Trang Phục & Làm Đẹp', itemName: 'Comple (Vest) cho bố', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 4000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'pre-8', category: 'Trang Phục & Làm Đẹp', itemName: 'Trang điểm cô dâu (Ngày cưới)', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: 'Gồm cả làm tóc', phaseId: TimelinePhase.P_1W },

  // Chụp ảnh & Nhẫn
  { id: 'av-1', category: 'Ảnh & Phim', itemName: 'Gói chụp ảnh Pre-wedding (Ảnh cưới)', assignee: 'Cả hai', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 12000000, actualCost: 0, note: 'Studio hoặc ngoại cảnh', phaseId: TimelinePhase.P_6M },
  { id: 'av-2', category: 'Ảnh & Phim', itemName: 'Phóng ảnh lớn (Ảnh cổng)', assignee: 'Cả hai', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 1000000, actualCost: 0, note: 'Kèm khung ảnh', phaseId: TimelinePhase.P_3M },
  { id: 'jw-1', category: 'Trang Sức', itemName: 'Nhẫn cưới (Cặp)', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Vàng tây/Vàng trắng', phaseId: TimelinePhase.P_6M },

  // --- 2. CHUẨN BỊ ĐÁM HỎI (Engagement) ---
  { id: 'ah-1', category: 'Lễ Ăn Hỏi', itemName: 'Áo dài ăn hỏi cô dâu chú rể', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 2000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'ah-2', category: 'Lễ Ăn Hỏi', itemName: 'Trang điểm ăn hỏi', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'ah-3', category: 'Lễ Ăn Hỏi', itemName: 'Bộ tráp ăn hỏi (5-7-9 lễ)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 7000000, actualCost: 0, note: 'Rượu, chè, cau, bánh...', phaseId: TimelinePhase.P_1M },
  { id: 'ah-4', category: 'Lễ Ăn Hỏi', itemName: 'Lì xì đội bê tráp (Nam & Nữ)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 2000000, actualCost: 0, note: 'Trả duyên', phaseId: TimelinePhase.P_1W },
  { id: 'ah-5', category: 'Lễ Ăn Hỏi', itemName: 'Thuê xe ô tô đi ăn hỏi (Nhà trai)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: 'Xe 16-29 chỗ', phaseId: TimelinePhase.P_1M },
  { id: 'ah-6', category: 'Lễ Ăn Hỏi', itemName: 'Trang phục đội đỡ lễ (Bê tráp)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 1000000, actualCost: 0, note: 'Thường thuê kèm tráp', phaseId: TimelinePhase.P_1M },
  { id: 'ah-7', category: 'Lễ Ăn Hỏi', itemName: 'Chụp ảnh lễ ăn hỏi', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'ah-8', category: 'Lễ Ăn Hỏi', itemName: 'Tiệc trà/ngọt mời khách tại nhà', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: 'Bánh kẹo, trà nước, hoa quả', phaseId: TimelinePhase.P_1W },
  { id: 'ah-9', category: 'Lễ Ăn Hỏi', itemName: 'Mời cơm thân mật họ hàng (Ăn hỏi)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Sau khi làm lễ', phaseId: TimelinePhase.P_1M },

  // --- 3. TỔ CHỨC LỄ CƯỚI & TIỆC CƯỚI (Wedding Day) ---
  { id: 'wd-1', category: 'Lễ Cưới', itemName: 'Thuê xe hoa (Xe đón dâu)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 4000000, actualCost: 0, note: 'Xe sang/Xe cổ', phaseId: TimelinePhase.P_3M },
  { id: 'wd-2', category: 'Lễ Cưới', itemName: 'Thuê xe chở họ hàng (Đưa/Đón dâu)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 4000000, actualCost: 0, note: 'Xe 29-45 chỗ', phaseId: TimelinePhase.P_1M },
  { id: 'wd-3', category: 'Lễ Cưới', itemName: 'Hoa cầm tay cô dâu & Hoa cài áo', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: '2 bó (Đón dâu + Tiệc)', phaseId: TimelinePhase.P_1W },
  { id: 'wd-4', category: 'Lễ Cưới', itemName: 'Quay phim phóng sự cưới', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 8000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_3M },
  { id: 'wd-5', category: 'Lễ Cưới', itemName: 'Chụp ảnh tiệc cưới', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 5000000, actualCost: 0, note: 'Truyền thống hoặc phóng sự', phaseId: TimelinePhase.P_3M },
  { id: 'wd-6', category: 'Lễ Cưới', itemName: 'Phông cưới / Rạp cưới tại nhà', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Bàn ghế, cổng hoa', phaseId: TimelinePhase.P_1M },

  // Tiệc nhà hàng
  { id: 'pt-1', category: 'Tiệc Cưới', itemName: 'Đặt cọc nhà hàng tiệc cưới', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_6M },
  { id: 'pt-2', category: 'Tiệc Cưới', itemName: 'Chi phí thực đơn (Cỗ cưới)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 100000000, actualCost: 0, note: 'Thanh toán sau tiệc', phaseId: TimelinePhase.P_0D },
  { id: 'pt-3', category: 'Tiệc Cưới', itemName: 'Đồ uống (Bia, nước ngọt)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Theo thực tế sử dụng', phaseId: TimelinePhase.P_0D },
  { id: 'pt-4', category: 'Tiệc Cưới', itemName: 'In thiệp cưới', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: '300-500 thiệp', phaseId: TimelinePhase.P_3M },
  { id: 'pt-5', category: 'Tiệc Cưới', itemName: 'Phí đăng ký kết hôn', assignee: 'Cả hai', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 1000000, actualCost: 0, note: 'Khám sức khỏe + Lệ phí', phaseId: TimelinePhase.P_6M },
  { id: 'pt-6', category: 'Tiệc Cưới', itemName: 'Phát sinh / Dự phòng', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_POST },

  // --- 4. MUA SẮM ĐỒ DÙNG (Home & Honeymoon) ---
  { id: 'hm-1', category: 'Nhà Cửa & Đời Sống', itemName: 'Bộ giường ngủ', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 8000000, actualCost: 0, note: 'Giường đôi', phaseId: TimelinePhase.P_12M },
  { id: 'hm-2', category: 'Nhà Cửa & Đời Sống', itemName: 'Đệm (Nệm)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 5000000, actualCost: 0, note: 'Everon/Kymdan', phaseId: TimelinePhase.P_12M },
  { id: 'hm-3', category: 'Nhà Cửa & Đời Sống', itemName: 'Chăn, ga, gối (2 bộ)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'hm-4', category: 'Nhà Cửa & Đời Sống', itemName: 'Tủ quần áo', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 6000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_12M },
  { id: 'hm-5', category: 'Nhà Cửa & Đời Sống', itemName: 'Bàn phấn (Bàn trang điểm)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 2000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_12M },
  { id: 'hm-6', category: 'Nhà Cửa & Đời Sống', itemName: 'Rèm cửa phòng cưới', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: '', phaseId: TimelinePhase.P_3M },
  { id: 'hm-7', category: 'Nhà Cửa & Đời Sống', itemName: 'Tủ lạnh / Tivi (Nếu cần)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'hm-8', category: 'Nhà Cửa & Đời Sống', itemName: 'Bàn thấp phòng khách', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 2000000, actualCost: 0, note: '', phaseId: TimelinePhase.P_1M },
  { id: 'hm-9', category: 'Khác', itemName: 'Tuần trăng mật', assignee: 'Chú Rể', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 15000000, actualCost: 0, note: 'Vé máy bay + Khách sạn', phaseId: TimelinePhase.P_POST },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'admin-main',
    email: 'danghoang.sqtt@gmail.com',
    displayName: 'Đăng Hoàng (Admin)',
    partnerName: 'Vợ Tương Lai',
    phoneNumber: '0343019101',
    photoURL: null,
    role: 'ADMIN',
    isActive: true,
    joinedAt: '2024-01-01',
    allowCustomApiKey: true,
    enableCloudStorage: true,
    weddingDate: '2024-12-31',
    showCountdown: true
  },
  {
    uid: 'user-1',
    email: 'user@wedplan.ai',
    displayName: 'Bạn Thân',
    partnerName: 'Người Thương',
    phoneNumber: '0987654321',
    photoURL: null,
    role: 'USER',
    isActive: true,
    joinedAt: '2024-01-02',
    allowCustomApiKey: true,
    enableCloudStorage: false,
    weddingDate: null,
    showCountdown: true
  },
  {
    uid: 'user-2',
    email: 'user_restricted@wedplan.ai',
    displayName: 'Người Dùng Mới',
    photoURL: null,
    role: 'USER',
    isActive: false,
    joinedAt: '2024-01-03',
    allowCustomApiKey: false,
    enableCloudStorage: false,
    weddingDate: null,
    showCountdown: false
  }
];

export const DEFAULT_GUEST_USER: UserProfile = {
  uid: 'e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9',
  email: null,
  displayName: 'Chủ nhân',
  photoURL: null,
  role: 'ADMIN',
  isActive: true,
  allowCustomApiKey: true,
  enableCloudStorage: true,
  weddingDate: null,
  showCountdown: false
};

export const INITIAL_INVITATION: InvitationData = {
  groomName: 'Hoàng',
  brideName: 'Hoa',
  groomParents: { father: 'Ông Nguyễn Văn Nam', mother: 'Bà Trần Thị Lan' },
  brideParents: { father: 'Ông Lê Văn Dũng', mother: 'Bà Phạm Thị Mai' },
  date: '2026-10-20',
  time: '11:00',
  location: 'Nhà hàng tiệc cưới Trống Đồng Palace',
  address: 'Số 1, Phố Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
  mapLink: 'https://maps.google.com',
  wishes: 'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi!',
  bankInfo: {
    bankId: 'VCB', // Vietcombank
    accountNumber: '123456789',
    accountName: 'NGUYEN VAN HOANG',
    qrTemplate: 'compact2',
  },
  photoConfig: { scale: 1, x: 0, y: 0 },
  themeColor: '#e11d48',
  templateId: 'modern',
  musicUrl: '/audio/romantic.mp3', // Nhạc lãng mạn có sẵn
  couplePhoto: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  galleryImages: [
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  // Feature flags
  countdownEnabled: true,
  rsvpEnabled: true,
  rsvpDeadline: '2026-10-10',
  guestbookEnabled: true,
  petalEffect: 'hearts',
  events: [
    {
      id: 'evt-1',
      title: 'Lễ Đón Khách',
      time: '10:30',
      date: '2026-10-20',
      location: 'Sảnh Đón Khách, Trống Đồng Palace'
    },
    {
      id: 'evt-2',
      title: 'Cử Hành Hôn Lễ',
      time: '11:00',
      date: '2026-10-20',
      location: 'Hội Trường Chính, Trống Đồng Palace'
    },
    {
      id: 'evt-3',
      title: 'Tiệc Mặn',
      time: '11:30',
      date: '2026-10-20',
      location: 'Hội Trường Chính, Trống Đồng Palace'
    }
  ],
  loveStory: [
    {
      id: 'ls-1',
      date: 'Tháng 12, 2020',
      title: 'Lần Đầu Gặp Gỡ',
      description: 'Chúng tôi quen nhau qua một buổi chiều đông Hà Nội tại một quán cà phê nhỏ góc phố cũ.',
      photo: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'ls-2',
      date: 'Tháng 2, 2022',
      title: 'Lời Yêu Đầu Tiên',
      description: 'Dưới bầu trời đầy sao của Đà Lạt, lời tỏ tình chính thức đã được nói ra đầy ngại ngùng.',
      photo: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'ls-3',
      date: 'Tháng 8, 2026',
      title: 'Cầu Hôn',
      description: 'Một bất ngờ không thể nào quên trước sự chứng kiến của những người bạn thân thiết nhất.',
      photo: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    }
  ],
  guestWishes: [
    {
      id: 'gw-1',
      name: 'Nguyễn Văn A',
      message: 'Chúc hai bạn trăm năm hạnh phúc, sớm sinh quý tử!',
      createdAt: '2024-01-10T10:00:00Z'
    },
    {
      id: 'gw-2',
      name: 'Trần Thị B',
      message: 'Happy Wedding! Chúc hai vợ chồng mãi mãi yêu thương nhau như ngày đầu.',
      createdAt: '2024-01-10T11:30:00Z'
    }
  ],
};