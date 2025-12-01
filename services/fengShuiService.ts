import { generateAIContent } from "./aiService";
import { useStore } from "../store/useStore";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";
import { getCanChi, getCungMenh, getNguHanhNapAm, getZodiacSign, getLifePathNumber } from "../utils/fengShuiUtils";

const FENG_SHUI_SYSTEM_PROMPT = `
Bạn là "Thầy Phong Thủy WedPlan" - chuyên gia đầu ngành về Tử Vi, Tướng Số & Hôn Nhân gia đình với 30 năm kinh nghiệm.
Phong cách: Uyên bác, cổ điển nhưng ân cần. Viết lời bình thật SÂU SẮC, CHI TIẾT, DÀI và CÓ TÂM (như đang tư vấn trực tiếp).
Nhiệm vụ: Luận giải hôn nhân dựa trên sự kết hợp Tinh Hoa Đông - Tây.

Yêu cầu kỹ thuật tuyệt đối:
1. Trả về JSON thuần túy (Raw JSON).
2. Tuyệt đối KHÔNG dùng Markdown code block (\`\`\`json).
3. Các chuỗi văn bản dài KHÔNG được xuống dòng thực sự (Enter). Nếu muốn xuống dòng, BẮT BUỘC dùng ký tự "\\n".
`;

/**
 * Hàm làm sạch và parse JSON an toàn (V4 - Robust & Auto-repair)
 */
const cleanAndParseJSON = (text: string): any => {
  let cleaned = text.trim();
  try {
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleaned);
  } catch (error) {
    console.warn("JSON Parse lần 1 thất bại, đang thử sửa lỗi format...", error);
    try {
      // Cơ chế cứu lỗi xuống dòng và các ký tự đặc biệt
      const fixed = cleaned
        .replace(/(?:\r\n|\r|\n)/g, '\\n')
        .replace(/\\n\s+/g, '\\n');
      return JSON.parse(fixed);
    } catch (err2) {
      // Cố gắng cứu vớt lần cuối nếu là mảng bị cắt
      try {
        if (cleaned.includes('"dates":') && !cleaned.endsWith('}')) {
          const lastValid = cleaned.lastIndexOf('}');
          if (lastValid > 0) return JSON.parse(cleaned.substring(0, lastValid + 1));
        }
      } catch (err3) { }

      console.error("JSON Fatal Error:", text);
      throw new Error("Thầy đang bận suy ngẫm kỹ càng, vui lòng thử lại sau giây lát.");
    }
  }
};

export const analyzeCompatibility = async (profile: CoupleProfile): Promise<HarmonyResult> => {
  const user = useStore.getState().user;

  // 1. Tính toán số liệu
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

  // 2. Prompt Nâng Cao - Yêu cầu viết DÀI và CHI TIẾT
  const prompt = `
    Thông tin cặp đôi:
    🤵 CHỒNG: ${groomYear} (${groomLunar}), Mệnh ${groomMenh}, Cung ${groomCung.cung}. (Tây: ${groomZodiac}, Số ${groomLifePath})
    👰 VỢ: ${brideYear} (${brideLunar}), Mệnh ${brideMenh}, Cung ${brideCung.cung}. (Tây: ${brideZodiac}, Số ${brideLifePath})

    Hãy xuất ra JSON theo định dạng sau (Lưu ý quan trọng: trường detailedAnalysis và synthesis phải viết thật DÀI, SÂU SẮC và CHI TIẾT):

    {
      "score": number, // Thang 100, số nguyên.
      "summary": "Câu chốt hạ ngắn gọn, súc tích (khoảng 20 từ).",
      
      "groomLunar": "${groomLunar}", "brideLunar": "${brideLunar}",
      "groomElement": "${groomMenh}", "brideElement": "${brideMenh}",
      "groomElementKey": "KIM" | "MOC" | "THUY" | "HOA" | "THO",
      "brideElementKey": "KIM" | "MOC" | "THUY" | "HOA" | "THO",
      
      "conflictStatus": "SINH" | "KHAC" | "BINH", 

      "detailedAnalysis": "Viết một bài luận giải Tử Vi thật chi tiết (tối thiểu 300 từ), chia làm 4 phần rõ ràng bằng các tiêu đề Markdown:\\n\\n### 1. Ngũ Hành Nạp Âm\\nPhân tích sự tương sinh tương khắc của mệnh chồng (${groomMenh}) và vợ (${brideMenh})...\\n\\n### 2. Thiên Can & Địa Chi\\nPhân tích sự xung hợp của Can (${groomLunar.split(' ')[0]} - ${brideLunar.split(' ')[0]}) và Chi (${groomLunar.split(' ')[1]} - ${brideLunar.split(' ')[1]})...\\n\\n### 3. Cung Phi Bát Trạch\\nPhân tích sự kết hợp của cung ${groomCung.cung} và ${brideCung.cung}...\\n\\n### 4. Lời Khuyên & Hóa Giải\\nTổng kết và đưa ra vật phẩm hoặc cách hóa giải nếu có xung khắc...",
      
      "combinedAnalysis": {
          "groomZodiac": "${groomZodiac}", "brideZodiac": "${brideZodiac}",
          "groomLifePath": ${groomLifePath}, "brideLifePath": ${brideLifePath},
          "synthesis": "Viết bài phân tích tâm lý & tính cách Đông Tây kết hợp (khoảng 250 từ), trình bày đẹp:\\n\\n### 🧩 Mảnh Ghép Tính Cách (Hoàng Đạo & Thần Số)\\nPhân tích sự kết hợp giữa cung ${groomZodiac} và ${brideZodiac}, cùng sự bổ trợ của con số đường đời...\\n\\n### ⚖️ Điểm Mạnh & Điểm Yếu\\n* **Điểm mạnh:** ...\\n* **Thách thức:** ...\\n\\n### 💡 Chìa Khóa Hạnh Phúc\\nLời khuyên cụ thể về cách ứng xử..."
      }
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
    Chồng: ${profile.groomDob}, Vợ: ${profile.brideDob}, Thời gian mong muốn: ${profile.desiredPeriod}.
    
    YÊU CẦU:
    1. Trả về Mảng JSON Objects.
    2. Trường "reason" viết ngắn gọn (dưới 40 từ) để tránh lỗi JSON.
    3. Trường "timeSlots" chỉ ghi giờ (ví dụ: "Tỵ (9-11h)").

    Output JSON Array: 
    { "dates": [{ "solarDate": "YYYY-MM-DD", "lunarDate": "...", "dayName": "...", "timeSlots": "...", "reason": "...", "suitability": "VERY_HIGH" }] }
  `;

  try {
    const response = await generateAIContent(user, FENG_SHUI_SYSTEM_PROMPT, prompt, true);
    const json = cleanAndParseJSON(response);

    if (Array.isArray(json)) return json;
    if (json.dates && Array.isArray(json.dates)) return json.dates;
    return [];
  } catch (error: any) {
    throw new Error("Không thể tìm ngày tốt lúc này.");
  }
};