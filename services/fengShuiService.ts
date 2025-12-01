import { generateAIContent } from "./aiService";
import { useStore } from "../store/useStore";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";

const FENG_SHUI_SYSTEM_PROMPT = `
Bạn là một Thầy Phong Thủy (Tử Vi & Tướng Số) uy tín, am hiểu sâu sắc về văn hóa Việt Nam.
Nhiệm vụ của bạn là xem tuổi vợ chồng và chọn ngày lành tháng tốt cho cưới hỏi.
Giọng văn: Trang trọng, cổ điển nhưng dễ hiểu, mang tính khuyên răn tích cực.
QUAN TRỌNG: Luôn trả về định dạng JSON hợp lệ tuyệt đối. Không thêm bất kỳ lời dẫn hay ký tự markdown nào ngoài JSON.
`;

/**
 * Hàm làm sạch và parse JSON an toàn hơn
 * Xử lý các lỗi thường gặp: Markdown block, ký tự xuống dòng chưa escape, dấu ngoặc kép lỗi.
 */
const cleanAndParseJSON = (text: string): any => {
  let cleaned = text;
  
  try {
    // 1. Xóa Markdown code blocks (```json ... ```)
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

    // 2. Trích xuất phần JSON hợp lệ (từ dấu { đầu tiên đến dấu } cuối cùng)
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 3. Thử parse lần 1 (Chuẩn)
    return JSON.parse(cleaned);

  } catch (error) {
    console.warn("JSON Parse lần 1 thất bại, đang thử sửa lỗi format...", error);
    
    try {
      // 4. Thử sửa lỗi phổ biến: Xuống dòng thực tế (Literal Newlines) trong chuỗi JSON gây lỗi
      // Thay thế các ký tự xuống dòng thực tế (\n, \r) bằng escape sequence (\\n)
      // Lưu ý: Chỉ thay thế nếu nó không phải là khoảng trắng JSON hợp lệ (khó xác định chính xác bằng regex đơn giản nhưng cách này cứu được 90% case văn bản dài)
      const fixed = cleaned
        .replace(/[\n\r]/g, '\\n') // Thay thế xuống dòng thực bằng \n
        .replace(/\\n\s+/g, '\\n'); // Xóa khoảng trắng thừa sau xuống dòng nếu có

      return JSON.parse(fixed);
    } catch (err2) {
      console.error("JSON Parsing Fatal Error. Raw text:", text);
      throw new Error("Hệ thống AI trả về dữ liệu không đúng định dạng JSON. Vui lòng thử lại.");
    }
  }
};

export const analyzeCompatibility = async (profile: CoupleProfile): Promise<HarmonyResult> => {
  const user = useStore.getState().user;
  
  const prompt = `
    Hãy phân tích sự hòa hợp của cặp đôi này:
    - Chồng: ${profile.groomName}, Sinh ngày (Dương lịch): ${profile.groomDob}, Giờ sinh: ${profile.groomTime || "Không rõ"}
    - Vợ: ${profile.brideName}, Sinh ngày (Dương lịch): ${profile.brideDob}, Giờ sinh: ${profile.brideTime || "Không rõ"}

    Yêu cầu phân tích:
    1. Chuyển đổi ngày sinh Dương lịch sang Âm lịch (Can Chi).
    2. Xác định Mệnh (Ngũ Hành), Thiên Can, Địa Chi, Cung Mệnh của cả hai.
    3. Luận giải sự xung hợp về Mệnh, Can Chi, Cung Phi, Thiên Mệnh Năm Sinh.
    4. Tính điểm hòa hợp trên thang 100.

    OUTPUT FORMAT (JSON Only - Chú ý escape dấu ngoặc kép " bằng \\"):
    {
      "score": number,
      "summary": "String tóm tắt (Ví dụ: Tam Hợp - Đại Cát)",
      "groomLunar": "String (Ví dụ: Giáp Tý - 1984)",
      "brideLunar": "String (Ví dụ: Ất Sửu - 1985)",
      "groomElement": "String (Ví dụ: Hải Trung Kim)",
      "brideElement": "String (Ví dụ: Lư Trung Hỏa)",
      "detailedAnalysis": "Markdown string giải thích chi tiết. Dùng các gạch đầu dòng và xuống dòng bằng \\n."
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
    Dựa trên tuổi của hai vợ chồng:
    - Chồng: ${profile.groomDob}
    - Vợ: ${profile.brideDob}
    
    Hãy tìm 5 ngày tốt nhất để tổ chức đám cưới trong khoảng thời gian mong muốn: ${profile.desiredPeriod}.

    Tiêu chí chọn ngày (Theo phong tục Việt Nam):
    - Ưu tiên ngày Hoàng Đạo, Đại An, Tốc Hỷ.
    - Tránh ngày Tam Nương, Nguyệt Kỵ, Sát Chủ, Thọ Tử, Dương Công Kỵ Nhật.
    - Ngày phải hợp với tuổi Cô Dâu & Chú Rể (hoặc ít nhất không xung khắc).
    - Có giờ đẹp trong ngày để rước dâu.

    OUTPUT FORMAT (JSON Only Array):
    {
      "dates": [
        {
          "solarDate": "YYYY-MM-DD",
          "lunarDate": "String (Ví dụ: 15/08 Âm lịch - Ngày Giáp Tý)",
          "dayName": "String (Ví dụ: Hoàng Đạo - Tư Mệnh)",
          "timeSlots": "String (Các giờ đẹp trong ngày)",
          "reason": "String giải thích ngắn gọn tại sao ngày này tốt",
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
