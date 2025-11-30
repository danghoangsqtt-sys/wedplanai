import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

// API Route này chạy hoàn toàn trên Server (Node.js).
// Mã nguồn và biến môi trường ở đây KHÔNG bị lộ xuống trình duyệt.

export async function POST(req: NextRequest) {
  try {
    const { message, systemPrompt, isJson } = await req.json();

    // Lấy API Key từ biến môi trường Server
    // Trong file .env.local, hãy đặt: API_KEY=... (Không có NEXT_PUBLIC_)
    const systemGeminiKey = process.env.API_KEY;
    
    if (!systemGeminiKey) {
       console.error("Missing API_KEY on server environment");
       return NextResponse.json({ error: "Hệ thống chưa cấu hình API Key (Server-side)." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: systemGeminiKey });
    
    // Cấu hình response format (JSON hoặc Text)
    const generationConfig: any = {
       systemInstruction: systemPrompt
    };

    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: generationConfig
    });

    return NextResponse.json({ text: result.text });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi xử lý phía Server" }, { status: 500 });
  }
}