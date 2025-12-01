import { generateAIContent } from "./aiService";
import { useStore } from "../store/useStore";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";
import { getCanChi, getCungMenh, getNguHanhNapAm, getZodiacSign, getLifePathNumber } from "../utils/fengShuiUtils";

const FENG_SHUI_SYSTEM_PROMPT = `
Bạn là "Thầy Phong Thủy WedPlan".
Nhiệm vụ: Trả về kết quả dưới dạng JSON thuần túy (Raw JSON).
Yêu cầu kỹ thuật:
1. Trả về JSON hợp lệ.
2. Không dùng Markdown (\`\`\`json).
3. Không xuống dòng trong chuỗi văn bản (dùng \\n nếu cần).
`;

/**
 * Hàm làm sạch và parse JSON an toàn (Nâng cấp v3)
 * Hỗ trợ cả Array [] và Object {}
 */
const cleanAndParseJSON = (text: string): any => {
  let cleaned = text;

  try {
    // 1. Xóa Markdown code blocks
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

    // 2. Tìm điểm bắt đầu và kết thúc của JSON (Hỗ trợ cả { và [)
    const firstOpenBrace = cleaned.indexOf('{');
    const firstOpenBracket = cleaned.indexOf('[');

    let startIndex = -1;
    let endIndex = -1;

    // Xác định xem JSON bắt đầu bằng { hay [
    if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
      startIndex = firstOpenBrace;
      endIndex = cleaned.lastIndexOf('}');
    } else if (firstOpenBracket !== -1) {
      startIndex = firstOpenBracket;
      endIndex = cleaned.lastIndexOf(']');
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    } else {
      // Nếu không tìm thấy cặp ngoặc hợp lệ, thử parse nguyên gốc (có thể AI trả về số hoặc chuỗi trần)
      console.warn("Không tìm thấy cặp ngoặc JSON rõ ràng, thử parse trực tiếp.");
    }

    // 3. Thử parse lần 1
    return JSON.parse(cleaned);

  } catch (error) {
    console.warn("JSON Parse lần 1 thất bại, đang thử sửa lỗi format...", error);

    try {
      // 4. Sửa lỗi xuống dòng (Newline) trong chuỗi
      const fixed = cleaned
        .replace(/(?:\r\n|\r|\n)/g, '\\n')
        .replace(/\\n\s+/g, '\\n');

      return JSON.parse(fixed);
    } catch (err2) {
      console.error("JSON Parsing Fatal Error. Raw text:", text);
      throw new Error("Dữ liệu bị lỗi định dạng. Vui lòng thử lại.");
    }
  }
};

export const analyzeCompatibility = async (profile: CoupleProfile): Promise<HarmonyResult> => {
  const user = useStore.getState().user;

  const groomDate = new Date(profile.groomDob);
  const brideDate = new Date(profile.brideDob);
  const groomYear = groomDate.getFullYear();
  const brideYear = brideDate.getFullYear();

  const groomLunar = getCanChi(groomYear);
  const brideLunar = getCanChi(brideYear);
  const groomMenh = getNguHanhNapAm(groomYear);
  const brideMenh = getNguHanhNapAm(brideYear);
  const groomCung = getCungMenh(groomYear, 'MALE');
  const brideCung = getCungMenh(brideYear, 'FEMALE');

  const groomZodiac = getZodiacSign(groomDate.getDate(), groomDate.getMonth() + 1);
  const brideZodiac = getZodiacSign(brideDate.getDate(), brideDate.getMonth() + 1);
  const groomLifePath = getLifePathNumber(profile.groomDob);
  const brideLifePath = getLifePathNumber(profile.brideDob);

  const prompt = `
    Cặp đôi:
    🤵 Nam: ${groomYear} (${groomLunar}), Mệnh ${groomMenh}, Cung ${groomCung.cung}. Tây: ${groomZodiac}, Số ${groomLifePath}.
    👰 Nữ: ${brideYear} (${brideLunar}), Mệnh ${brideMenh}, Cung ${brideCung.cung}. Tây: ${brideZodiac}, Số ${brideLifePath}.

    Output JSON (Thang điểm 100, không số lẻ):
    {
      "score": number, 
      "summary": "Câu chốt ngắn",
      "groomLunar": "${groomLunar}", "brideLunar": "${brideLunar}",
      "groomElement": "${groomMenh}", "groomElementKey": "KIM", 
      "brideElement": "${brideMenh}", "brideElementKey": "KIM",
      "conflictStatus": "SINH", 
      "detailedAnalysis": "Luận giải chi tiết (dùng \\n xuống dòng).",
      "combinedAnalysis": {
          "groomZodiac": "${groomZodiac}", "brideZodiac": "${brideZodiac}",
          "groomLifePath": ${groomLifePath}, "brideLifePath": ${brideLifePath},
          "synthesis": "Luận giải Đông Tây kết hợp."
      }
    }
    (Lưu ý: ElementKey phải là một trong: KIM, MOC, THUY, HOA, THO. ConflictStatus: SINH, KHAC, BINH)
  `;

  try {
    const response = await generateAIContent(user, FENG_SHUI_SYSTEM_PROMPT, prompt, true);
    return cleanAndParseJSON(response);
  } catch (error: any) {
    console.error("Feng Shui Error Detail:", error);
    throw new Error(error.message || "Lỗi kết nối thầy phong thủy.");
  }
};

export const findAuspiciousDates = async (profile: CoupleProfile): Promise<AuspiciousDate[]> => {
  const user = useStore.getState().user;

  // Tối ưu Prompt: Yêu cầu trả về Object chứa mảng, và giới hạn độ dài text để tránh lỗi cắt chuỗi
  const prompt = `
    Tìm 5 ngày cưới tốt nhất cho:
    Chồng: ${profile.groomDob}, Vợ: ${profile.brideDob}, Thời gian: ${profile.desiredPeriod}.
    
    YÊU CẦU BẮT BUỘC:
    1. Trả về đúng cấu trúc JSON Object: { "dates": [...] }
    2. Trường "reason" viết ngắn gọn dưới 30 từ.
    3. Trường "timeSlots" chỉ ghi giờ (Ví dụ: "9h-11h").

    Output JSON Sample:
    {
      "dates": [
        {
          "solarDate": "YYYY-MM-DD",
          "lunarDate": "Ngày Âm",
          "dayName": "Hoàng Đạo",
          "timeSlots": "Tỵ (9-11h)",
          "reason": "Hợp tuổi, ngày Đại An.",
          "suitability": "VERY_HIGH"
        }
      ]
    }
  `;

  try {
    const response = await generateAIContent(user, FENG_SHUI_SYSTEM_PROMPT, prompt, true);
    const json = cleanAndParseJSON(response);

    // Xử lý trường hợp AI trả về mảng trực tiếp thay vì object { dates: [] }
    if (Array.isArray(json)) {
      return json;
    } else if (json.dates && Array.isArray(json.dates)) {
      return json.dates;
    } else {
      return [];
    }
  } catch (error: any) {
    console.error("Date Find Error:", error);
    throw new Error("Không thể tìm ngày tốt lúc này. Vui lòng thử lại.");
  }
};