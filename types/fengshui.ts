
export type ElementKey = 'KIM' | 'MOC' | 'THUY' | 'HOA' | 'THO';

export interface CoupleProfile {
  groomName: string;
  groomDob: string; // YYYY-MM-DD
  groomTime: string; // HH:mm
  brideName: string;
  brideDob: string; // YYYY-MM-DD
  brideTime: string; // HH:mm
  desiredPeriod: string; // e.g. "Tháng 10 năm 2024"
}

export interface FuturePrediction {
  whoSupportsWhom: string; // Phân tích ai vượng ai
  financialOutlook: string; // Tài lộc sau cưới
  childrenLuck: string; // Đường con cái
}

export interface HarmonyResult {
  score: number;
  summary: string;
  groomLunar: string;
  brideLunar: string;

  groomElement: string;
  groomElementKey: ElementKey;

  brideElement: string;
  brideElementKey: ElementKey;

  conflictStatus: 'SINH' | 'KHAC' | 'BINH';

  detailedAnalysis: string;

  // Phần mở rộng đa chiều
  combinedAnalysis?: {
    groomZodiac: string; // Cung Hoàng Đạo
    brideZodiac: string;
    groomLifePath: number; // Thần số học
    brideLifePath: number;
    synthesis: string; // Lời bình tổng hợp từ AI
  };

  // MỚI: Dự đoán tương lai (Tài lộc, Con cái, Vượng phu/thê)
  futurePrediction?: FuturePrediction;
}

export interface AuspiciousDate {
  solarDate: string;
  lunarDate: string;
  dayName: string;
  timeSlots: string;
  reason: string;
  suitability: 'VERY_HIGH' | 'HIGH' | 'MODERATE';
  eventType: 'AN_HOI' | 'CUOI' | 'RUOC_DAU' | 'KHAC'; // Phân loại ngày
}

export interface FengShuiState {
  profile: CoupleProfile;
  harmonyResult: HarmonyResult | null;
  auspiciousDates: AuspiciousDate[];
}
