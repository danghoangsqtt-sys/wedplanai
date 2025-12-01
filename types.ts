
export enum AttendanceProbability {
  CONFIRMED = 100, // Chắc chắn
  LIKELY = 80,     // Khả năng cao
  POSSIBLE = 50,   // Có thể
  UNLIKELY = 0     // Không tham dự
}

export enum GuestGroup {
  GROOM = "Nhà Trai",
  BRIDE = "Nhà Gái",
  FRIEND = "Bạn Bè",
  WORK = "Đồng Nghiệp"
}

export interface Guest {
  id: string;
  name: string;
  group: GuestGroup;
  probability: AttendanceProbability;
  childrenCount: number;
  redEnvelope: number; // Tiền mừng dự kiến (VNĐ)
}

export enum TaskStatus {
  PENDING = "Chưa làm",
  IN_PROGRESS = "Đang tiến hành",
  DONE = "Đã xong",
  PAID = "Đã thanh toán"
}

export type WeddingSide = 'GROOM' | 'BRIDE' | 'BOTH';

export interface BudgetItem {
  id: string;
  category: string; // e.g., "Lễ Hỏi", "Trang Trí", "Tiệc Cưới"
  itemName: string; // e.g., "Tráp ăn hỏi", "Backdrop"
  assignee: string; // e.g., "Chú Rể", "Mẹ Cô Dâu"
  side: WeddingSide;
  collaborator?: string;
  deadline?: string; // ISO date string (YYYY-MM-DD)
  status: TaskStatus;
  estimatedCost: number;
  actualCost: number;
  note?: string;
}

export interface DashboardStats {
  totalGuests: number;
  weightedGuestCount: number;
  totalChildren: number;
  confirmedGuests: number;
  totalBudget: number;
  totalActual: number;
  expectedGiftMoney: number;
  pendingTasks: number;
}

// --- Auth & System Types ---

export type UserRole = 'ADMIN' | 'USER' | 'GUEST';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  partnerName?: string | null; // Tên người bạn đời
  phoneNumber?: string | null; // Số điện thoại liên hệ
  photoURL: string | null;
  role: UserRole;
  isActive: boolean; // Trạng thái kích hoạt tài khoản
  joinedAt?: string; // Ngày đăng ký
  allowCustomApiKey: boolean; // Quyền nhập API Key cá nhân (cho USER)
  enableCloudStorage: boolean; // Quyền lưu trữ dữ liệu lên Firebase
  weddingDate?: string | null; // Ngày cưới (ISO String YYYY-MM-DD)
  showCountdown?: boolean; // Hiển thị đếm ngược dashboard
}

export interface AppSettings {
  geminiApiKey: string; // Changed from openaiApiKey
  currency: 'VND' | 'USD';
  themeMode: 'light' | 'dark';
  enableNotifications: boolean;
}

// --- Notification Types ---
export type NotificationType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

// --- Procedure & Culture Types ---

export type WeddingRegion = 'NORTH' | 'CENTRAL' | 'SOUTH';

export interface ProcedureTaskTemplate {
  itemName: string;
  category: string;
  estimatedCost: number;
  assignee: string;
  side: WeddingSide;
}

export interface ProcedureStep {
  id: string;
  title: string;
  icon?: string;
  description: string;
  meaning: string;
  participants: string;
  offerings: string[]; // Sính lễ
  customImages?: Record<string, string>; // Map tên sính lễ -> URL ảnh tùy chỉnh
  taboos?: string[]; // Điều kiêng kỵ
  tips?: string[];   // Mẹo hay
  scriptSuggestion: string; // Basic topic for speech
  tasks: ProcedureTaskTemplate[];
}

// --- Invitation & Marketing Types ---
export interface BankInfo {
  bankId: string; // e.g., "MB", "VCB"
  accountNumber: string;
  accountName: string;
  template: 'qr_code' | 'compact';
}

export interface PhotoConfig {
  scale: number;
  x: number;
  y: number;
}

export interface InvitationData {
  templateId: string;
  groomName: string;
  brideName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  address: string;
  mapLink: string;
  bankInfo: BankInfo;
  wishes: string;

  // NEW PHOTO FIELDS
  couplePhoto?: string; // Base64 string
  photoConfig?: PhotoConfig;

  // Deprecated but kept for type safety during migration if needed
  sticker?: any;

  themeColor: string;
}
