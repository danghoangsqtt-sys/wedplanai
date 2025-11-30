
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
  score: number; // 0-100
  summary: string; // e.g., "Tam Hợp - Rất Tốt"
  groomLunar: string; // e.g., "Giáp Tý"
  brideLunar: string; // e.g., "Ất Sửu"
  groomElement: string; // e.g., "Hải Trung Kim"
  brideElement: string; // e.g., "Lư Trung Hỏa"
  detailedAnalysis: string; // Markdown text
}

export interface AuspiciousDate {
  solarDate: string; // YYYY-MM-DD
  lunarDate: string; // e.g., "15/08 (Giáp Thân)"
  dayName: string; // e.g., "Ngày Hoàng Đạo"
  timeSlots: string; // e.g., "Giờ đẹp: Tỵ (9-11h), Mùi (13-15h)"
  reason: string;
  suitability: 'VERY_HIGH' | 'HIGH' | 'MODERATE';
}

export interface FengShuiState {
  profile: CoupleProfile;
  harmonyResult: HarmonyResult | null;
  auspiciousDates: AuspiciousDate[];
}
