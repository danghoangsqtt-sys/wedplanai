
import { UserProfile } from "../types";
import { useStore } from "../store/useStore";
import { GoogleGenAI } from "@google/genai";

// --- ERROR CLASSIFICATION ---
const classifyGeminiError = (error: any): string => {
  const status = error.status || error.httpStatusCode || error.code;
  const msg = error.message || error.errorMessage || '';

  // Network / fetch errors
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('ECONNREFUSED')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
  }

  // Classify by HTTP status
  switch (status) {
    case 400:
      if (msg.includes('API_KEY') || msg.includes('api key') || msg.includes('API key')) {
        return 'API Key không hợp lệ hoặc bị vô hiệu hóa. Vui lòng kiểm tra lại trong Cài đặt.';
      }
      return `Yêu cầu không hợp lệ: ${msg || 'Prompt có thể quá dài hoặc chứa nội dung bị chặn.'}`;
    case 401:
    case 403:
      return 'API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại trong Cài đặt.';
    case 404:
      return 'Model AI không tồn tại hoặc chưa được kích hoạt cho API Key này.';
    case 429:
      return 'Đã vượt giới hạn số lần gọi API (rate limit). Vui lòng đợi 30-60 giây rồi thử lại.';
    case 500:
    case 502:
    case 503:
      return 'Máy chủ AI đang quá tải hoặc bảo trì. Vui lòng thử lại sau ít phút.';
    default:
      // Return the real error message, never a misleading "API Key" fallback
      return msg
        ? `Lỗi AI (Code ${status || 'N/A'}): ${msg}`
        : `Lỗi không xác định từ AI (Code ${status || 'N/A'}). Vui lòng thử lại.`;
  }
};

// --- RETRY LOGIC ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryable = (error: any): boolean => {
  const status = error.status || error.httpStatusCode || error.code;
  if ([429, 500, 502, 503].includes(status)) return true;
  const msg = (error.message || '').toLowerCase();
  return msg.includes('overloaded') || msg.includes('unavailable') || msg.includes('deadline') || msg.includes('timeout');
};

// --- CẤU HÌNH GEMINI ---
const callGeminiDirect = async (
  systemPrompt: string,
  userMessage: string,
  isJson: boolean = false,
  customApiKey?: string,
  maxRetries: number = 3 // Always default to 3 retries (to handle 503 Service Unavailable properly)
) => {
  // @ts-ignore
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = customApiKey || envKey;

  if (!apiKey) {
    throw new Error("Thiếu API Key Gemini. Vui lòng kiểm tra Cài đặt hoặc file .env.local");
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // On retry #2+, fall back to text/plain and parse JSON manually
      // (some models intermittently reject application/json)
      const useJsonMode = isJson && attempt === 1;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: useJsonMode ? "application/json" : "text/plain",
          temperature: isJson ? 0.3 : 0.85,
          topP: 0.95,
          maxOutputTokens: isJson ? 16384 : 4096,
        }
      });

      return response.text;

    } catch (error: any) {
      lastError = error;
      console.error(`Gemini Error (attempt ${attempt}/${maxRetries}):`, {
        status: error.status || error.httpStatusCode,
        message: error.message,
        isJson,
        attempt,
      });

      // Don't retry on non-retryable errors (auth, bad request, etc.)
      if (!isRetryable(error) || attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  // All retries exhausted — throw a clear, classified error
  throw new Error(classifyGeminiError(lastError));
};

export const validateGeminiKey = async (apiKey: string): Promise<boolean> => {
  try {
    await callGeminiDirect("You are a helper.", "Hello", false, apiKey, 1);
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

  if (
    user.role === 'ADMIN' ||
    user.role === 'GUEST' ||
    (user.role === 'USER' && !user.isActive)
  ) {
    return await callGeminiDirect(systemPrompt, userMessage, isJson);
  }

  if (user.role === 'USER' && user.isActive) {
    if (!user.allowCustomApiKey) throw new Error("Tài khoản chưa được cấp quyền sử dụng AI.");

    const userKey = useStore.getState().settings.geminiApiKey;
    if (!userKey) throw new Error("Vui lòng nhập Gemini API Key trong phần Cài đặt để sử dụng.");

    return await callGeminiDirect(systemPrompt, userMessage, isJson, userKey);
  }

  throw new Error("Role không hợp lệ.");
};

// --- IMAGE GENERATION (NEW) ---
export const generateWeddingSticker = async (
  user: UserProfile | null,
  promptDescription: string,
  action: string,
  refImages: { groom?: string, bride?: string } // Base64 strings
) => {
  // @ts-ignore
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  let apiKey = envKey;

  if (user?.role === 'USER' && user.isActive && user.allowCustomApiKey) {
    apiKey = useStore.getState().settings.geminiApiKey;
  }

  if (!apiKey) throw new Error("Thiếu API Key để tạo ảnh.");

  const ai = new GoogleGenAI({ apiKey });

  // Construct Prompt
  const fullPrompt = `Create a high-quality "Cute Chibi Wedding Sticker".
  Characters: A Groom and a Bride.
  Appearance details: ${promptDescription}.
  Action/Pose: ${action}.
  Style: Flat 2D vector art, cute, vibrant colors, white background, sticker style with white outline.
  Expression: Happy, romantic, blushing.
  IMPORTANT: Make sure the characters look like a cohesive couple.
  `;

  const parts: any[] = [
    { text: fullPrompt }
  ];

  // Add reference images if provided (Image-to-Image / Multimodal)
  if (refImages.groom) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: refImages.groom.split(',')[1] // Remove data:image/jpeg;base64, prefix
      }
    });
    parts.push({ text: "Reference image for Groom's face/hair:" });
  }
  if (refImages.bride) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: refImages.bride.split(',')[1]
      }
    });
    parts.push({ text: "Reference image for Bride's face/hair:" });
  }

  try {
    // Prefer Pro model for image gen if available/allowed, otherwise Flash Image
    // Note: 'gemini-2.5-flash-image' is good for multimodal input
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        // Only set generation config if supported by model version
      }
    });

    // Extract image
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Không tìm thấy ảnh trong phản hồi của AI.");

  } catch (error: any) {
    console.error("Image Gen Error:", error);
    throw new Error("Lỗi tạo ảnh: " + (error.message || "Unknown error"));
  }
};

/**
 * Lấy mẹo thực hiện task từ AI
 */
export const askAITaskTip = async (taskName: string, category: string, apiKey: string): Promise<string> => {
  if (!apiKey) return "Vui lòng cấu hình API Key để sử dụng tính năng này.";
  
  const systemPrompt = `Bạn là chuyên gia tư vấn tổ chức đám cưới tại Việt Nam.
Người dùng đang cần thực hiện công việc: "${taskName}" (Mảng: ${category}).
Hãy đưa ra 3-5 gạch đầu dòng mẹo thực tế, ngắn gọn, thiết thực để giúp họ hoàn thành công việc này tốt nhất (tránh bỡ ngỡ, tiết kiệm chi phí, hoặc phòng rủi ro). Không cần lời chào.`;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await callAIWithRetry(ai, "gemini-2.5-flash", systemPrompt);
    return response.trim();
  } catch (error: any) {
    console.error("AI Task Tip Error:", error);
    return "Không thể kết nối AI. Vui lòng kiểm tra lại cấu hình.";
  }
};
