import { Guest, GuestGroup, AttendanceProbability, BudgetItem, TaskStatus, UserProfile } from '../types';

export const INITIAL_GUESTS: Guest[] = [
  { id: '1', name: 'Nguyễn Văn A', group: GuestGroup.GROOM, probability: AttendanceProbability.CONFIRMED, childrenCount: 2, redEnvelope: 1000000 },
  { id: '2', name: 'Trần Thị B', group: GuestGroup.BRIDE, probability: AttendanceProbability.LIKELY, childrenCount: 0, redEnvelope: 500000 },
];

export const INITIAL_BUDGET_ITEMS: BudgetItem[] = [
  // --- 1. CHUẨN BỊ ĐÁM CƯỚI (Pre-Wedding) ---
  // Trang phục & Làm đẹp
  { id: 'pre-1', category: 'Trang Phục & Làm Đẹp', itemName: 'Váy cưới cô dâu (Thuê/May)', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Váy đi bàn + Váy làm lễ' },
  { id: 'pre-2', category: 'Trang Phục & Làm Đẹp', itemName: 'Comple (Vest) chú rể', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 4000000, actualCost: 0, note: 'May đo hoặc mua sẵn' },
  { id: 'pre-3', category: 'Trang Phục & Làm Đẹp', itemName: 'Giày cưới cô dâu', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: 'Cao gót thoải mái' },
  { id: 'pre-4', category: 'Trang Phục & Làm Đẹp', itemName: 'Giày tây chú rể', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: '' },
  { id: 'pre-5', category: 'Trang Phục & Làm Đẹp', itemName: 'Cravat / Nơ chú rể', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 300000, actualCost: 0, note: '' },
  { id: 'pre-6', category: 'Trang Phục & Làm Đẹp', itemName: 'Áo dài mẹ cô dâu & mẹ chú rể', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: 'Thuê hoặc may' },
  { id: 'pre-7', category: 'Trang Phục & Làm Đẹp', itemName: 'Comple (Vest) cho bố', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 4000000, actualCost: 0, note: '' },
  { id: 'pre-8', category: 'Trang Phục & Làm Đẹp', itemName: 'Trang điểm cô dâu (Ngày cưới)', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: 'Gồm cả làm tóc' },
  
  // Chụp ảnh & Nhẫn
  { id: 'av-1', category: 'Ảnh & Phim', itemName: 'Gói chụp ảnh Pre-wedding (Ảnh cưới)', assignee: 'Cả hai', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 12000000, actualCost: 0, note: 'Studio hoặc ngoại cảnh' },
  { id: 'av-2', category: 'Ảnh & Phim', itemName: 'Phóng ảnh lớn (Ảnh cổng)', assignee: 'Cả hai', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 1000000, actualCost: 0, note: 'Kèm khung ảnh' },
  { id: 'jw-1', category: 'Trang Sức', itemName: 'Nhẫn cưới (Cặp)', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Vàng tây/Vàng trắng' },

  // --- 2. CHUẨN BỊ ĐÁM HỎI (Engagement) ---
  { id: 'ah-1', category: 'Lễ Ăn Hỏi', itemName: 'Áo dài ăn hỏi cô dâu chú rể', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 2000000, actualCost: 0, note: '' },
  { id: 'ah-2', category: 'Lễ Ăn Hỏi', itemName: 'Trang điểm ăn hỏi', assignee: 'Cô Dâu', side: 'BRIDE', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: '' },
  { id: 'ah-3', category: 'Lễ Ăn Hỏi', itemName: 'Bộ tráp ăn hỏi (5-7-9 lễ)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 7000000, actualCost: 0, note: 'Rượu, chè, cau, bánh...' },
  { id: 'ah-4', category: 'Lễ Ăn Hỏi', itemName: 'Lì xì đội bê tráp (Nam & Nữ)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 2000000, actualCost: 0, note: 'Trả duyên' },
  { id: 'ah-5', category: 'Lễ Ăn Hỏi', itemName: 'Thuê xe ô tô đi ăn hỏi (Nhà trai)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: 'Xe 16-29 chỗ' },
  { id: 'ah-6', category: 'Lễ Ăn Hỏi', itemName: 'Trang phục đội đỡ lễ (Bê tráp)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 1000000, actualCost: 0, note: 'Thường thuê kèm tráp' },
  { id: 'ah-7', category: 'Lễ Ăn Hỏi', itemName: 'Chụp ảnh lễ ăn hỏi', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: '' },
  { id: 'ah-8', category: 'Lễ Ăn Hỏi', itemName: 'Tiệc trà/ngọt mời khách tại nhà', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: 'Bánh kẹo, trà nước, hoa quả' },
  { id: 'ah-9', category: 'Lễ Ăn Hỏi', itemName: 'Mời cơm thân mật họ hàng (Ăn hỏi)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Sau khi làm lễ' },

  // --- 3. TỔ CHỨC LỄ CƯỚI & TIỆC CƯỚI (Wedding Day) ---
  { id: 'wd-1', category: 'Lễ Cưới', itemName: 'Thuê xe hoa (Xe đón dâu)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 4000000, actualCost: 0, note: 'Xe sang/Xe cổ' },
  { id: 'wd-2', category: 'Lễ Cưới', itemName: 'Thuê xe chở họ hàng (Đưa/Đón dâu)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 4000000, actualCost: 0, note: 'Xe 29-45 chỗ' },
  { id: 'wd-3', category: 'Lễ Cưới', itemName: 'Hoa cầm tay cô dâu & Hoa cài áo', assignee: 'Chú Rể', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: '2 bó (Đón dâu + Tiệc)' },
  { id: 'wd-4', category: 'Lễ Cưới', itemName: 'Quay phim phóng sự cưới', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 8000000, actualCost: 0, note: '' },
  { id: 'wd-5', category: 'Lễ Cưới', itemName: 'Chụp ảnh tiệc cưới', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 5000000, actualCost: 0, note: 'Truyền thống hoặc phóng sự' },
  { id: 'wd-6', category: 'Lễ Cưới', itemName: 'Phông cưới / Rạp cưới tại nhà', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Bàn ghế, cổng hoa' },
  
  // Tiệc nhà hàng
  { id: 'pt-1', category: 'Tiệc Cưới', itemName: 'Đặt cọc nhà hàng tiệc cưới', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: '' },
  { id: 'pt-2', category: 'Tiệc Cưới', itemName: 'Chi phí thực đơn (Cỗ cưới)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 100000000, actualCost: 0, note: 'Thanh toán sau tiệc' },
  { id: 'pt-3', category: 'Tiệc Cưới', itemName: 'Đồ uống (Bia, nước ngọt)', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: 'Theo thực tế sử dụng' },
  { id: 'pt-4', category: 'Tiệc Cưới', itemName: 'In thiệp cưới', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: '300-500 thiệp' },
  { id: 'pt-5', category: 'Tiệc Cưới', itemName: 'Phí đăng ký kết hôn', assignee: 'Cả hai', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 1000000, actualCost: 0, note: 'Khám sức khỏe + Lệ phí' },
  { id: 'pt-6', category: 'Tiệc Cưới', itemName: 'Phát sinh / Dự phòng', assignee: 'Cả hai nhà', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: '' },

  // --- 4. MUA SẮM ĐỒ DÙNG (Home & Honeymoon) ---
  { id: 'hm-1', category: 'Nhà Cửa & Đời Sống', itemName: 'Bộ giường ngủ', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 8000000, actualCost: 0, note: 'Giường đôi' },
  { id: 'hm-2', category: 'Nhà Cửa & Đời Sống', itemName: 'Đệm (Nệm)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 5000000, actualCost: 0, note: 'Everon/Kymdan' },
  { id: 'hm-3', category: 'Nhà Cửa & Đời Sống', itemName: 'Chăn, ga, gối (2 bộ)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 3000000, actualCost: 0, note: '' },
  { id: 'hm-4', category: 'Nhà Cửa & Đời Sống', itemName: 'Tủ quần áo', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 6000000, actualCost: 0, note: '' },
  { id: 'hm-5', category: 'Nhà Cửa & Đời Sống', itemName: 'Bàn phấn (Bàn trang điểm)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 2000000, actualCost: 0, note: '' },
  { id: 'hm-6', category: 'Nhà Cửa & Đời Sống', itemName: 'Rèm cửa phòng cưới', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 1500000, actualCost: 0, note: '' },
  { id: 'hm-7', category: 'Nhà Cửa & Đời Sống', itemName: 'Tủ lạnh / Tivi (Nếu cần)', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 10000000, actualCost: 0, note: '' },
  { id: 'hm-8', category: 'Nhà Cửa & Đời Sống', itemName: 'Bàn thấp phòng khách', assignee: 'Nhà Trai', side: 'GROOM', status: TaskStatus.PENDING, estimatedCost: 2000000, actualCost: 0, note: '' },
  { id: 'hm-9', category: 'Khác', itemName: 'Tuần trăng mật', assignee: 'Chú Rể', side: 'BOTH', status: TaskStatus.PENDING, estimatedCost: 15000000, actualCost: 0, note: 'Vé máy bay + Khách sạn' },
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
  uid: 'guest-default',
  email: null,
  displayName: 'Khách',
  photoURL: null,
  role: 'GUEST',
  isActive: true,
  allowCustomApiKey: false,
  enableCloudStorage: false,
  weddingDate: null,
  showCountdown: false
};
