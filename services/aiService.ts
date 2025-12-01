import { UserProfile } from "../types";
import { useStore } from "../store/useStore";
// SỬA: Import đúng thư viện đã cài trong package.json
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CẤU HÌNH GEMINI ---
const callGeminiDirect = async (systemPrompt: string, userMessage: string, isJson: boolean = false, customApiKey?: string) => {
  // @ts-ignore
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = customApiKey || envKey;

  if (!apiKey) {
    throw new Error("Thiếu API Key Gemini. Vui lòng kiểm tra Cài đặt hoặc file .env.local");
  }

  try {
    // SỬA: Khởi tạo đúng class GoogleGenerativeAI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Cấu hình generation config
    const generationConfig: any = {};
    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    // SỬA: Lấy model trước rồi mới gọi generateContent
    // Lưu ý: Tên model chuẩn hiện tại thường là 'gemini-1.5-flash' hoặc 'gemini-2.0-flash-exp'
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Hoặc 'gemini-2.0-flash-exp' nếu bạn có quyền truy cập
      systemInstruction: systemPrompt, // System prompt được đưa vào cấu hình model
      generationConfig
    });

    const result = await model.generateContent(userMessage);
    const response = await result.response;

    return response.text();

  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Xử lý thông báo lỗi thân thiện hơn
    let errorMsg = error.message || 'Lỗi không xác định';
    if (errorMsg.includes('API key')) errorMsg = 'API Key không hợp lệ.';

    throw new Error(`Lỗi kết nối AI: ${errorMsg}`);
  }
};

export const validateGeminiKey = async (apiKey: string): Promise<boolean> => {
  try {
    await callGeminiDirect("You are a helper.", "Hello", false, apiKey);
    return true;
  } catch (error) {
    throw error;
  }
};

export const generateAIContent = async (
  user: UserProfile | null,
  systemPrompt: string,
  userMessage: string,
  isJson: boolean = false
) => {
  if (!user) throw new Error("Vui lòng đăng nhập.");

  // 1. ADMIN, GUEST hoặc USER chưa active: Dùng System Key
  if (
    user.role === 'ADMIN' ||
    user.role === 'GUEST' ||
    (user.role === 'USER' && !user.isActive)
  ) {
    return await callGeminiDirect(systemPrompt, userMessage, isJson);
  }

  // 2. USER đã kích hoạt (Active): Dùng Key cá nhân
  if (user.role === 'USER' && user.isActive) {
    if (!user.allowCustomApiKey) throw new Error("Tài khoản chưa được cấp quyền sử dụng AI.");

    const userKey = useStore.getState().settings.geminiApiKey;
    if (!userKey) throw new Error("Vui lòng nhập Gemini API Key trong phần Cài đặt để sử dụng.");

    return await callGeminiDirect(systemPrompt, userMessage, isJson, userKey);
  }

  throw new Error("Role không hợp lệ.");
};