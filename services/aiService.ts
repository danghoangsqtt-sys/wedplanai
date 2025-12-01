
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

// --- NEW: GENERATE WEDDING IMAGES ---
export const generateWeddingImages = async (
  groomFile: File,
  brideFile: File,
  customApiKey?: string
): Promise<string[]> => {
  // @ts-ignore
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = customApiKey || envKey;

  if (!apiKey) {
    throw new Error("Thiếu API Key Gemini.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Helper to convert file to base64 for Gemini
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  try {
    // 1. Analyze Faces using Gemini Vision
    const groomB64 = await fileToBase64(groomFile);
    const brideB64 = await fileToBase64(brideFile);

    const analysisPrompt = "Describe the physical appearance of these two people in detail (gender, hair color, hair style, skin tone, approximate age, facial features). Do not mention their current clothing. Label them as 'Person A (Groom)' and 'Person B (Bride)'.";

    const visionResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: groomFile.type, data: groomB64 } },
          { inlineData: { mimeType: brideFile.type, data: brideB64 } },
          { text: analysisPrompt }
        ]
      }
    });

    const description = visionResponse.text;

    // 2. Define Styles
    const styles = [
      "Traditional Vietnamese Wedding, Ao Dai, Red and Gold, Temple Background",
      "Cinematic Lighting, Romantic Evening, Formal Suit and White Wedding Dress, Bokeh",
      "Korean Wedding Studio Style, Soft Pastel Colors, Bright Lighting, Minimalist",
      "Vintage Film Photography, 1990s Hong Kong Style, Nostalgic Grain",
      "Outdoor Nature, Garden Wedding, Sunlight, Greenery and Floral Arch"
    ];

    const generatedImagesB64: string[] = [];

    // 3. Generate Images using Imagen (Simulated Loop)
    // NOTE: If the key does not support Imagen, this part might fail or need a fallback.
    // We try to generate.

    for (const style of styles) {
      const imagePrompt = `A high quality, photorealistic wedding photo of a couple. 
        Based on these descriptions: ${description}.
        Style: ${style}. 
        The groom is wearing a suit or traditional attire matching the style. 
        The bride is wearing a wedding dress or Ao Dai matching the style.
        Look at camera, happy expression, 8k resolution.`;

      try {
        const response = await ai.models.generateImages({
          model: 'imagen-3.0-generate-001',
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '3:4', // Portrait for phone viewing
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          generatedImagesB64.push(response.generatedImages[0].image.imageBytes);
        }
      } catch (e) {
        console.error(`Error generating style ${style}:`, e);
        // If generation fails (e.g. model not available), push a placeholder based on style
        // This ensures the app doesn't break if user has a text-only key
        // In production, you would throw or handle gracefully.
      }
    }

    if (generatedImagesB64.length === 0) {
      throw new Error("Không thể tạo ảnh. Có thể API Key của bạn chưa được kích hoạt quyền truy cập Imagen (Image Generation).");
    }

    return generatedImagesB64;

  } catch (error: any) {
    console.error("Generate Wedding Images Error:", error);
    throw new Error(error.message || "Lỗi khi tạo ảnh cưới.");
  }
};
