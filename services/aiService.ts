import { UserProfile } from "../types";
import { useStore } from "../store/useStore";
// Đảm bảo bạn đang dùng thư viện chuẩn: npm install @google/generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CẤU HÌNH GEMINI (Hỗ trợ Admin & User) ---
const callGeminiDirect = async (systemPrompt: string, userMessage: string, isJson: boolean = false, customApiKey?: string) => {
  // Logic chọn Key:
  // 1. Nếu có customApiKey (từ User), dùng nó.
  // 2. Nếu không (User là Admin), dùng Key hệ thống từ biến môi trường.
  // @ts-ignore
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Thiếu API Key Gemini. Vui lòng nhập Key trong Cài đặt hoặc kiểm tra file .env");
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);

    const generationConfig: any = {};
    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    // Sử dụng model Flash cho tốc độ nhanh và tối ưu chi phí (Free tier ok)
    // Bạn có thể đổi thành "gemini-2.0-flash-exp" nếu muốn thử nghiệm bản mới nhất
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig
    });

    const finalPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    return response.text();

  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Xử lý lỗi cụ thể để hiển thị thông báo thân thiện
    if (error.message?.includes('API key not valid') || error.status === 400) {
      throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại trên Google AI Studio.");
    }
    throw new Error(`Lỗi kết nối AI (Code ${error.status || 'Unknown'}): ${error.message}`);
  }
};

// --- HÀM KIỂM TRA KEY (Thay thế validateOpenAIKey cũ) ---
export const validateGeminiKey = async (apiKey: string): Promise<boolean> => {
  try {
    // Gọi thử một request đơn giản để kiểm tra Key có hoạt động không
    await callGeminiDirect("Test connection", "Hello", false, apiKey);
    return true;
  } catch (error) {
    throw error;
  }
};

// --- HÀM CHÍNH: ĐIỀU HƯỚNG YÊU CẦU ---
export const generateAIContent = async (
  user: UserProfile | null,
  systemPrompt: string,
  userMessage: string,
  isJson: boolean = false
) => {
  if (!user) throw new Error("Vui lòng đăng nhập.");
  if (user.role === 'GUEST') throw new Error("Khách không có quyền dùng AI.");

  // 1. ADMIN: Dùng Key hệ thống (không truyền customApiKey vào hàm gọi)
  if (user.role === 'ADMIN') {
    return await callGeminiDirect(systemPrompt, userMessage, isJson);
  }

  // 2. USER: Dùng Key cá nhân Gemini
  if (user.role === 'USER') {
    if (!user.allowCustomApiKey) throw new Error("Tài khoản chưa được kích hoạt tính năng AI.");

    // Lấy key từ store (Đảm bảo bạn đã sửa store/useStore.ts để có biến geminiApiKey)
    const userKey = useStore.getState().settings.geminiApiKey;

    if (!userKey) throw new Error("Vui lòng nhập Gemini API Key trong phần Cài đặt.");

    // Gọi Gemini với key riêng của user
    return await callGeminiDirect(systemPrompt, userMessage, isJson, userKey);
  }

  throw new Error("Role không hợp lệ.");
};