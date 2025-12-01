import { generateAIContent } from "./aiService";
import { useStore } from "../store/useStore";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";

const FENG_SHUI_SYSTEM_PROMPT = `
Bạn là "Thầy Phong Thủy WedPlan" chuyên nghiệp.
Nhiệm vụ: Trả về kết quả dưới dạng JSON thuần túy (Raw JSON).
QUAN TRỌNG: 
1. Không sử dụng Markdown code block (như \`\`\`json).
2. Mọi ký tự xuống dòng trong nội dung văn bản phải được viết là "\\n" (escape), không được xuống dòng thật.
3. Không thêm bất kỳ lời dẫn nào ngoài JSON.
`;

/**
 * Hàm làm sạch và parse JSON an toàn (Robust JSON Parser)
 */
const cleanAndParseJSON = (text: string): any => {
  let cleaned = text;
  
  try {
    // 1. Xóa Markdown code blocks nếu AI lỡ thêm vào
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

    // 2. Trích xuất phần JSON hợp lệ (từ dấu { đầu đến } cuối)
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
      // 4. Thử sửa lỗi phổ biến: AI trả về xuống dòng thật (Literal Newlines) gây lỗi JSON
      // Thay thế các ký tự xuống dòng thực tế (\n, \r) bằng escape sequence (\\n)
      // Regex này cố gắng giữ lại cấu trúc JSON nhưng escape nội dung text
      const fixed = cleaned
        .replace(/[\n\r]/g, '\\n') // Thay thế xuống dòng thực bằng \n
        .replace(/\\n\s+/g, '\\n'); // Xóa khoảng trắng thừa sau xuống dòng

      return JSON.parse(fixed);
    } catch (err2) {
      console.error("JSON Parsing Fatal Error. Raw text:", text);
      throw new Error("Dữ liệu từ thầy phong thủy bị lỗi định dạng. Vui lòng thử lại lần nữa.");
    }
  }
};

export const analyzeCompatibility = async (profile: CoupleProfile): Promise<HarmonyResult> => {
  const user = useStore.getState().user;
  
  // Prompt được tối ưu để tránh lỗi JSON
  const prompt = `
    Gia chủ nhờ xem duyên phận vợ chồng:
    - Chồng: ${profile.groomName} (${profile.groomDob}) - Giờ: ${profile.groomTime || "Không rõ"}
    - Vợ: ${profile.brideName} (${profile.brideDob}) - Giờ: ${profile.brideTime || "Không rõ"}

    Yêu cầu output JSON chính xác (chú ý escape dấu ngoặc kép " thành \\"):
    {
      "score": number,
      "summary": "Câu chốt ngắn gọn",
      "groomLunar": "Can Chi (Ví dụ: Giáp Tý)",
      "brideLunar": "Can Chi (Ví dụ: Ất Sửu)",
      "groomElement": "Mệnh Nạp Âm",
      "groomElementKey": "KIM" | "MOC" | "THUY" | "HOA" | "THO",
      "brideElement": "Mệnh Nạp Âm",
      "brideElementKey": "KIM" | "MOC" | "THUY" | "HOA" | "THO",
      "conflictStatus": "SINH" | "KHAC" | "BINH", 
      "detailedAnalysis": "Viết nội dung dài ở đây. Dùng \\n để xuống dòng. Tuyệt đối không dùng dấu xuống dòng thật."
    }
  `;

  try {
    // Thêm tham số true để báo hiệu format JSON
    const response = await generateAIContent(user, FENG_SHUI_SYSTEM_PROMPT, prompt, true);
    return cleanAndParseJSON(response);
  } catch (error: any) {
    console.error("Feng Shui Error:", error);
    throw new Error(error.message || "Không thể luận giải lúc này. Vui lòng thử lại.");
  }
};

// ... (Giữ nguyên hàm findAuspiciousDates nhưng dùng cleanAndParseJSON mới)
export const findAuspiciousDates = async (profile: CoupleProfile): Promise<AuspiciousDate[]> => {
  const user = useStore.getState().user;
  const prompt = `
    Chọn 5 ngày cưới tốt nhất cho:
    - Chồng: ${profile.groomDob}
    - Vợ: ${profile.brideDob}
    - Thời gian: ${profile.desiredPeriod}

    Output JSON:
    {
      "dates": [
        {
          "solarDate": "YYYY-MM-DD",
          "lunarDate": "Ngày Âm",
          "dayName": "Tên ngày",
          "timeSlots": "Giờ đẹp",
          "reason": "Lý do",
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
