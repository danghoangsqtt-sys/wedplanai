
import { UserProfile } from "../types";
import { useStore } from "../store/useStore";
import { GoogleGenAI } from "@google/genai";

// --- CẤU HÌNH GEMINI ---
const callGeminiDirect = async (systemPrompt: string, userMessage: string, isJson: boolean = false, customApiKey?: string) => {
  // @ts-ignore
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = customApiKey || envKey;

  if (!apiKey) {
    throw new Error("Thiếu API Key Gemini. Vui lòng kiểm tra Cài đặt hoặc file .env.local");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: isJson ? "application/json" : "text/plain"
      }
    });

    return response.text;

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(`Lỗi kết nối AI (Code ${error.status || 'Unknown'}): ${error.message || 'Vui lòng kiểm tra lại API Key.'}`);
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
