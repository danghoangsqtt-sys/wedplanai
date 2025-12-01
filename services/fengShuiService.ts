import { generateAIContent } from "./aiService";
import { useStore } from "../store/useStore";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";
import { getCanChi, getCungMenh, getNguHanhNapAm } from "../utils/fengShuiUtils";

const FENG_SHUI_SYSTEM_PROMPT = `
Bạn là "Thầy Phong Thủy WedPlan" - chuyên gia cao cấp về Tử Vi & Hôn Nhân.
Nhiệm vụ: Dựa trên thông tin Tử Vi CHÍNH XÁC tôi cung cấp để luận giải.
Yêu cầu:
- Tuyệt đối KHÔNG tự tính lại Can Chi/Cung Mệnh (vì tôi đã cung cấp sẵn).
- Giọng văn: Trang trọng, cổ điển, tích cực.
- Nếu xung khắc, BẮT BUỘC phải gợi ý cách hóa giải.
`;

const cleanAndParseJSON = (text: string): any => {
  try {
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON Parse Error:", text);
    throw new Error("Dữ liệu thầy phong thủy gửi về bị lỗi. Vui lòng thử lại.");
  }
};

export const analyzeCompatibility = async (profile: CoupleProfile): Promise<HarmonyResult> => {
  const user = useStore.getState().user;

  // 1. TÍNH TOÁN DỮ LIỆU CỐ ĐỊNH (Hard Calculation)
  const groomYear = new Date(profile.groomDob).getFullYear();
  const brideYear = new Date(profile.brideDob).getFullYear();

  const groomLunar = getCanChi(groomYear);
  const brideLunar = getCanChi(brideYear);

  const groomCung = getCungMenh(groomYear, 'MALE');
  const brideCung = getCungMenh(brideYear, 'FEMALE');

  const groomMenh = getNguHanhNapAm(groomYear);
  const brideMenh = getNguHanhNapAm(brideYear);

  // 2. GỬI DỮ LIỆU ĐÃ TÍNH CHO AI
  const prompt = `
    Thông tin Tử Vi đã xác thực:
    🤵 CHỒNG: ${groomYear} (${groomLunar}) - Mệnh: ${groomMenh} - Cung: ${groomCung.cung} (${groomCung.hanh})
    👰 VỢ: ${brideYear} (${brideLunar}) - Mệnh: ${brideMenh} - Cung: ${brideCung.cung} (${brideCung.hanh})

    Yêu cầu Output JSON chuẩn (Không thêm lời dẫn):
    {
      "score": number, // Thang 100 (Ví dụ 75, 80).
      "summary": "Câu chốt ngắn gọn",
      "groomLunar": "${groomLunar}", 
      "brideLunar": "${brideLunar}",
      "groomElement": "${groomMenh}",
      "groomElementKey": "KIM" | "MOC" | "THUY" | "HOA" | "THO", 
      "brideElement": "${brideMenh}",
      "brideElementKey": "KIM" | "MOC" | "THUY" | "HOA" | "THO",
      "conflictStatus": "SINH" | "KHAC" | "BINH", 
      "detailedAnalysis": "Luận giải chi tiết. Dùng \\n để xuống dòng."
    }
  `;

  try {
    const response = await generateAIContent(user, FENG_SHUI_SYSTEM_PROMPT, prompt, true);
    return cleanAndParseJSON(response);
  } catch (error: any) {
    throw new Error(error.message || "Lỗi kết nối thầy phong thủy.");
  }
};

export const findAuspiciousDates = async (profile: CoupleProfile): Promise<AuspiciousDate[]> => {
  const user = useStore.getState().user;
  const prompt = `
    Tìm 5 ngày cưới tốt nhất cho:
    Chồng: ${profile.groomDob}, Vợ: ${profile.brideDob}, Thời gian: ${profile.desiredPeriod}.
    Output JSON Array: { "dates": [{ "solarDate": "YYYY-MM-DD", "lunarDate": "...", "dayName": "...", "timeSlots": "...", "reason": "...", "suitability": "VERY_HIGH" }] }
  `;

  try {
    const response = await generateAIContent(user, FENG_SHUI_SYSTEM_PROMPT, prompt, true);
    const json = cleanAndParseJSON(response);
    return json.dates || [];
  } catch (error: any) {
    throw new Error("Không thể tìm ngày tốt lúc này.");
  }
};