import { UserProfile } from "../types";
import { useStore } from "../store/useStore";
// Đảm bảo bạn đang dùng thư viện chuẩn: npm install @google/generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CẤU HÌNH GEMINI 3.0 (2025) ---
const callGeminiDirect = async (systemPrompt: string, userMessage: string, isJson: boolean = false) => {
  // @ts-ignore
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Thiếu API Key Gemini. Vui lòng kiểm tra file .env.local");
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);

    const generationConfig: any = {};
    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    // --- CẬP NHẬT MODEL 2025 ---
    // Mẹo: Dùng "gemini-pro" để Google tự động chọn bản mới nhất (3.0 hoặc 3.5)
    // Nếu bạn biết chính xác mã, có thể thay bằng "gemini-3.0-pro"
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
    // Nếu alias gemini-pro bị lỗi, hãy thử đích danh gemini-1.5-flash (bản backup an toàn)
    throw new Error(`Lỗi kết nối AI (Code ${error.status}): ${error.message}`);
  }
};

// --- CẤU HÌNH OPENAI GPT-5.0 (2025) ---
const callOpenAI = async (apiKey: string, systemPrompt: string, userMessage: string, isJson: boolean = false) => {
  if (!apiKey) throw new Error("Vui lòng nhập OpenAI API Key.");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Cập nhật lên GPT-4.0 theo yêu cầu của bạn
        // Lưu ý: Nếu OpenAI chưa mở API này cho Key của bạn, hãy đổi về "gpt-4o"
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: isJson ? { type: "json_object" } : undefined,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Lỗi kết nối OpenAI.");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    throw new Error(error.message || "Lỗi OpenAI.");
  }
};

export const validateOpenAIKey = async (apiKey: string): Promise<boolean> => {
  try {
    await callOpenAI(apiKey, "Test", "Hi", false);
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
  if (user.role === 'GUEST') throw new Error("Khách không có quyền dùng AI.");

  // 1. ADMIN dùng Gemini (Key hệ thống)
  if (user.role === 'ADMIN') {
    return await callGeminiDirect(systemPrompt, userMessage, isJson);
  }

  // 2. USER dùng OpenAI (Key cá nhân)
  if (user.role === 'USER') {
    if (!user.allowCustomApiKey) throw new Error("Chưa có quyền dùng AI.");
    const userKey = useStore.getState().settings.openaiApiKey;
    if (!userKey) throw new Error("Thiếu API Key trong Cài đặt.");
    return await callOpenAI(userKey, systemPrompt, userMessage, isJson);
  }

  throw new Error("Role không hợp lệ.");
};