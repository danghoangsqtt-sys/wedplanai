export interface CoupleProfile {
  groomName: string;
  groomDob: string;
  groomTime: string;
  brideName: string;
  brideDob: string;
  brideTime: string;
  desiredPeriod: string;
}

// Cập nhật Interface mới cho đẹp hơn
export interface HarmonyResult {
  score: number;
  summary: string;
  groomInfo: {
    lunarYear: string;
    menh: string;
    cung: string;
    thienCan: string;
    diaChi: string;
  };
  brideInfo: {
    lunarYear: string;
    menh: string;
    cung: string;
    thienCan: string;
    diaChi: string;
  };
  analysis: {
    menh: string;
    thienCan: string;
    diaChi: string;
    cungMenh: string;
  };
  conclusion: string;
  // Giữ lại các trường cũ để tránh lỗi legacy code nếu cần, nhưng optional
  groomLunar?: string;
  brideLunar?: string;
  groomElement?: string;
  brideElement?: string;
  detailedAnalysis?: string;
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
