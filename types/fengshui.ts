export type ElementKey = 'KIM' | 'MOC' | 'THUY' | 'HOA' | 'THO';

export interface CoupleProfile {
  groomName: string;
  groomDob: string;
  groomTime: string;
  brideName: string;
  brideDob: string;
  brideTime: string;
  desiredPeriod: string;
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

  // THÊM MỚI: Dữ liệu cho biểu đồ Radar (Mạng nhện)
  radarChart?: {
    subject: string;
    A: number; // Điểm Chồng
    B: number; // Điểm Vợ (hoặc điểm hòa hợp)
    fullMark: number;
  }[];

  combinedAnalysis?: {
    groomZodiac: string;
    brideZodiac: string;
    groomLifePath: number;
    brideLifePath: number;
    synthesis: string;
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