import { generateAIContent } from "./aiService";
import { useStore } from "../store/useStore";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";
import { getCanChi, getCungMenh, getNguHanhNapAm } from "../utils/fengShuiUtils"; // Import hàm mới

const FENG_SHUI_SYSTEM_PROMPT = `
Bạn là "Thầy Phong Thủy WedPlan". Tôi sẽ cung cấp thông tin Tử Vi CHÍNH XÁC (Can, Chi, Cung, Mệnh) của hai vợ chồng.
Nhiệm vụ của bạn là: Dựa trên các thông số tôi cung cấp, hãy luận giải sự xung hợp và chấm điểm.
TUYỆT ĐỐI KHÔNG tự tính lại Can Chi hay Cung Mệnh, hãy tin tưởng dữ liệu đầu vào.
`;

/**
 * Helper function to clean and parse JSON from AI response.
 */
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
    console.error("JSON Parsing Error. Raw text:", text);
    throw new Error("Thầy đang bận xem kỹ lại quẻ, vui lòng thử lại sau giây lát.");
  }
};

export const analyzeCompatibility = async (profile: CoupleProfile): Promise<HarmonyResult> => {
  const user = useStore.getState().user;

  // 1. TÍNH TOÁN DỮ LIỆU CỐ ĐỊNH (Hard Calculation)
  const groomYear = new Date(profile.groomDob).getFullYear();
  const brideYear = new Date(profile.brideDob).getFullYear();

  const groomLunar = getCanChi(groomYear); // Ví dụ: Kỷ Mão
  const brideLunar = getCanChi(brideYear); // Ví dụ: Tân Tỵ

  const groomCung = getCungMenh(groomYear, 'MALE'); // {cung: 'Khảm', hanh: 'Thủy'}
  const brideCung = getCungMenh(brideYear, 'FEMALE'); // {cung: 'Đoài', hanh: 'Kim'}

  const groomMenh = getNguHanhNapAm(groomYear); // Thành Đầu Thổ
  const brideMenh = getNguHanhNapAm(brideYear); // Bạch Lạp Kim

  // 2. GỬI DỮ LIỆU ĐÃ TÍNH CHO AI
  const prompt = `
    Thông tin Tử Vi đã xác thực (Vui lòng dùng thông tin này để luận giải):
    
    🤵 CHỒNG: 
    - Sinh năm: ${groomYear} (${groomLunar})
    - Mệnh: ${groomMenh}
    - Cung Phi: Cung ${groomCung.cung} (Hành ${groomCung.hanh})

    👰 VỢ:
    - Sinh năm: ${brideYear} (${brideLunar})
    - Mệnh: ${brideMenh}
    - Cung Phi: Cung ${brideCung.cung} (Hành ${brideCung.hanh})

    Yêu cầu:
    1. Luận giải sự hòa hợp về Mệnh (Ngũ hành nạp âm).
    2. Luận giải sự hòa hợp về Cung Phi Bát Trạch (Ví dụ: Khảm kết hợp Đoài là Họa Hại hay Sinh Khí?).
    3. Luận giải Thiên Can, Địa Chi.
    4. Tính điểm hòa hợp (Thang 100).

    OUTPUT FORMAT (JSON Only):
    {
      "score": number, 
      "summary": "Câu chốt ngắn gọn",
      "groomLunar": "${groomLunar}", 
      "brideLunar": "${brideLunar}",
      
      "groomElement": "${groomMenh}",
      "groomElementKey": "KIM" | "MOC" | "THUY" | "HOA" | "THO", 
      
      "brideElement": "${brideMenh}",
      "brideElementKey": "KIM" | "MOC" | "THUY" | "HOA" | "THO",

      "conflictStatus": "SINH" | "KHAC" | "BINH", 

      "detailedAnalysis": "Viết chi tiết luận giải dựa trên dữ liệu trên. Xuống dòng bằng \\n."
    }
  `;

  try {
    const response = await generateAIContent(user, FENG_SHUI_SYSTEM_PROMPT, prompt, true);
    return cleanAndParseJSON(response);
  } catch (error: any) {
    console.error("Feng Shui Error:", error);
    throw new Error(error.message || "Không thể luận giải lúc này. Vui lòng thử lại.");
  }
};

export const findAuspiciousDates = async (profile: CoupleProfile): Promise<AuspiciousDate[]> => {
  const user = useStore.getState().user;

  const prompt = `
    Gia chủ muốn chọn ngày cưới.
    - Chồng: ${profile.groomDob}
    - Vợ: ${profile.brideDob}
    - Khoảng thời gian mong muốn: ${profile.desiredPeriod}

    Nhiệm vụ của Thầy: Tìm 5 ngày ĐẠI CÁT (tốt nhất) trong khoảng thời gian trên để tổ chức Lễ Cưới (Rước Dâu).

    Tiêu chí lọc ngày khắt khe:
    1. **Tránh tuổi Kim Lâu** của cô dâu.
    2. **Ngày Hoàng Đạo**.
    3. **Tránh ngày xấu:** Tam Nương, Nguyệt Kỵ, Thọ Tử, Sát Chủ, Dương Công Kỵ Nhật.
    4. **Hợp tuổi:** Ngày không được xung Thái Tuế với cô dâu/chú rể.
    5. **Nhị Thập Bát Tú:** Ưu tiên các sao tốt.
    6. **Trực:** Ưu tiên Trực Khai, Trực Kiến, Trực Bình, Trực Mãn.

    OUTPUT FORMAT (JSON Only Array):
    {
      "dates": [
        {
          "solarDate": "YYYY-MM-DD",
          "lunarDate": "Ngày Âm (Can Chi)",
          "dayName": "Tên ngày (Ví dụ: Ngày Hoàng Đạo - Trực Khai)",
          "timeSlots": "Giờ Hoàng Đạo đẹp nhất để Rước Dâu (Ví dụ: Giờ Tỵ (09h-11h), Giờ Thân (15h-17h))",
          "reason": "Giải thích chi tiết tại sao tốt: Hợp mệnh nào, Sao nào chiếu, Lợi cho việc gì (Cầu tài, Cầu con...).",
          "suitability": "VERY_HIGH" | "HIGH" | "MODERATE"
        }
      ]
    }
  `;

  try {
    const response = await generateAIContent(user, FENG_SHUI_SYSTEM_PROMPT, prompt, true);
    const json = cleanAndParseJSON(response);
    return json.dates || [];
  } catch (error: any) {
    console.error("Date Selection Error:", error);
    throw new Error(error.message || "Không thể tìm ngày lúc này. Vui lòng thử lại.");
  }
};