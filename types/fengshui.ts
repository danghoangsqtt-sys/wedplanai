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

  // MỚI: Phần mở rộng đa chiều
  combinedAnalysis?: {
    groomZodiac: string; // Cung Hoàng Đạo
    brideZodiac: string;
    groomLifePath: number; // Thần số học
    brideLifePath: number;
    synthesis: string; // Lời bình tổng hợp từ AI
  };
}

export interface AuspiciousDate {
  solarDate: string;
  lunarDate: string;
  dayName: string;
  timeSlots: string;
  reason: string;
  suitability: 'VERY_HIGH' | 'HIGH' | 'MODERATE';
}

export interface FengShuiState {
  profile: CoupleProfile;
  harmonyResult: HarmonyResult | null;
  auspiciousDates: AuspiciousDate[];
}