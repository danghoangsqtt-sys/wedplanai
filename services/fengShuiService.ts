
import { generateAIContent } from "./aiService";
import { useStore } from "../store/useStore";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";

const FENG_SHUI_SYSTEM_PROMPT = `
Bạn là "Thầy Phong Thủy WedPlan" - một chuyên gia cao cấp về Tử Vi, Tướng Số và Phong Thủy Hôn Nhân theo văn hóa truyền thống Việt Nam.
Kiến thức của bạn bao gồm: Ngũ Hành Nạp Âm, Thiên Can Địa Chi, Cung Phi Bát Trạch (Lữ Tài), và Cao Ly Đầu Hình.

Phong cách trả lời:
- Xưng hô: "Thầy" và "Hai bạn" hoặc "Gia chủ".
- Giọng văn: Trang trọng, cổ điển, uyên bác nhưng ân cần, mang tính xây dựng.
- Nguyên tắc vàng: "Đức năng thắng số". Nếu tuổi xung khắc, BẮT BUỘC phải đưa ra giải pháp hóa giải (như chọn năm sinh con, hướng nhà, hướng bếp) để trấn an người dùng. Không được nói lời tuyệt vọng gây hoang mang.
`;

/**
 * Helper function to clean and parse JSON from AI response.
 * Handles cases where AI wraps JSON in Markdown code blocks or adds preamble text.
 */
const cleanAndParseJSON = (text: string): any => {
  try {
    // 1. Remove Markdown code block markers if present
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    // 2. Find the First '{' and Last '}' to extract the valid JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 3. Attempt to parse
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON Parsing Error. Raw text:", text);
    throw new Error("Thầy đang bận xem kỹ lại quẻ, vui lòng thử lại sau giây lát.");
  }
};

export const analyzeCompatibility = async (profile: CoupleProfile): Promise<HarmonyResult> => {
  const user = useStore.getState().user;
  
  const prompt = `
    Gia chủ nhờ xem duyên phận vợ chồng:
    - Chồng (Nam mệnh): ${profile.groomName}, Sinh ngày dương: ${profile.groomDob}, Giờ: ${profile.groomTime || "Không rõ"}
    - Vợ (Nữ mệnh): ${profile.brideName}, Sinh ngày dương: ${profile.brideDob}, Giờ: ${profile.brideTime || "Không rõ"}

    HÃY LUẬN GIẢI CHI TIẾT THEO CẤU TRÚC SAU (Trả về JSON):

    1. **Chuyển đổi**: Đổi ngày sinh sang Âm Lịch (Can Chi). Xác định Mệnh (Ngũ Hành Nạp Âm), Cung Phi (theo Bát Trạch).
    2. **Xét 5 yếu tố chính**:
       - **Mệnh (Ngũ hành):** Tương sinh hay Tương khắc? (Ví dụ: Chồng Kim - Vợ Thủy là Tương Sinh).
       - **Thiên Can:** Hợp hay Phá?
       - **Địa Chi:** Tam Hợp/Lục Hợp hay Tứ Hành Xung/Lục Hại?
       - **Cung Phi Bát Trạch (Rất quan trọng):** Kết hợp Cung chồng và Cung vợ ra du niên nào (Sinh Khí, Phúc Đức, Thiên Y, Phục Vị là tốt; Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại là xấu).
       - **Cao Ly Đầu Hình:** Xem Thiên Can chồng và Địa Chi vợ.
    3. **Tổng kết điểm số:** Thang điểm 100.
    4. **Lời bình & Hóa giải:** Viết một đoạn văn Markdown đẹp. Nếu có xung khắc (đặc biệt là Tuyệt Mệnh hay Ngũ Quỷ), hãy chỉ cách hóa giải cụ thể (ví dụ: Sinh con năm nào để trung hòa, kê giường hướng nào).

    OUTPUT FORMAT (JSON Only):
    {
      "score": number,
      "summary": "Câu chốt ngắn gọn (Ví dụ: Cung Diên Niên - Trăm năm hạnh phúc)",
      "groomLunar": "Can Chi - Mệnh - Cung (Ví dụ: Giáp Tý - Hải Trung Kim - Cung Đoài)",
      "brideLunar": "Can Chi - Mệnh - Cung (Ví dụ: Ất Sửu - Hải Trung Kim - Cung Ly)",
      "groomElement": "Mệnh Ngũ Hành (Ví dụ: Kim)",
      "brideElement": "Mệnh Ngũ Hành (Ví dụ: Kim)",
      "detailedAnalysis": "Chuỗi Markdown trình bày kết quả. Dùng các icon (✅, ⚠️, 🔥) để sinh động. Cần chia rõ các mục: 1. Luận Ngũ Hành, 2. Luận Cung Phi, 3. Luận Can Chi, 4. Kết Luận & Hóa Giải."
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
    1. **Tránh tuổi Kim Lâu** của cô dâu (nếu phạm Kim Lâu thì phải đợi qua Đông Chí hoặc tư vấn cách 'Xin dâu hai lần').
    2. **Ngày Hoàng Đạo:** Phải là ngày tốt trong tháng.
    3. **Tránh ngày xấu:** Tam Nương, Nguyệt Kỵ, Thọ Tử, Sát Chủ, Dương Công Kỵ Nhật.
    4. **Hợp tuổi:** Ngày không được xung Thái Tuế với cô dâu/chú rể.
    5. **Nhị Thập Bát Tú:** Ưu tiên các sao tốt (Giác, Phòng, Vĩ, Cơ...).
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
