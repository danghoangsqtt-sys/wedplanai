import { UserProfile } from "../types";
import { useStore } from "../store/useStore";

// --- GEMINI IMPLEMENTATION (Admin - Server Side Proxy) ---
// Thay vì gọi trực tiếp GoogleGenAI ở đây (lộ Key), ta gọi API Route của Next.js
const callGeminiProxy = async (systemPrompt: string, userMessage: string, isJson: boolean = false) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        systemPrompt: systemPrompt,
        isJson: isJson,
        provider: 'GEMINI' // Đánh dấu để server biết dùng Gemini
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Lỗi từ Server khi gọi AI.");
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    throw new Error(error.message || "Không thể kết nối tới máy chủ AI.");
  }
};

// --- OPENAI IMPLEMENTATION (User - Client Side with Personal Key) ---
// User dùng Key riêng của họ thì có thể gọi trực tiếp từ Client (hoặc Proxy cũng được, nhưng ở đây giữ nguyên logic User Key)
const callOpenAI = async (apiKey: string, systemPrompt: string, userMessage: string, isJson: boolean = false) => {
  if (!apiKey) throw new Error("Vui lòng nhập OpenAI API Key trong phần Cài đặt.");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Cost-effective and capable model
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
      const code = err.error?.code || 'unknown';
      if (code === 'invalid_api_key') throw new Error("API Key không hợp lệ.");
      if (code === 'insufficient_quota') throw new Error("API Key đã hết hạn mức sử dụng (Quota).");
      throw new Error(err.error?.message || "Lỗi kết nối OpenAI.");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    throw new Error(error.message || "Lỗi không xác định từ OpenAI.");
  }
};

// --- HELPER: VALIDATE KEY ---
export const validateOpenAIKey = async (apiKey: string): Promise<boolean> => {
  try {
    await callOpenAI(apiKey, "Test connection", "Hello", false);
    return true;
  } catch (error) {
    throw error;
  }
};

// --- FACTORY FUNCTION ---

export const generateAIContent = async (
  user: UserProfile | null,
  systemPrompt: string,
  userMessage: string,
  isJson: boolean = false
) => {
  if (!user) throw new Error("Vui lòng đăng nhập.");

  if (user.role === 'GUEST') {
    throw new Error("Tài khoản Khách không có quyền sử dụng AI. Vui lòng liên hệ Admin.");
  }

  // 1. ADMIN STRATEGY (Gemini via Server Proxy)
  if (user.role === 'ADMIN') {
    // Gọi qua Proxy để bảo mật System Key
    return await callGeminiProxy(systemPrompt, userMessage, isJson);
  }

  // 2. USER STRATEGY (OpenAI with Personal Key)
  if (user.role === 'USER') {
    if (!user.allowCustomApiKey) {
      throw new Error("Bạn chưa được cấp quyền sử dụng AI. Vui lòng liên hệ Admin.");
    }
    const userKey = useStore.getState().settings.openaiApiKey;
    if (!userKey) {
        throw new Error("Chưa có API Key. Vui lòng vào Cài đặt > Kết nối & API để nhập.");
    }
    return await callOpenAI(userKey, systemPrompt, userMessage, isJson);
  }
  
  throw new Error("Role không hợp lệ.");
};