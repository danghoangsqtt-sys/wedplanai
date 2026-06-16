import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("No API key found in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello, this is a test.',
      config: {
        systemInstruction: "You are a helpful assistant.",
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 8192,
      }
    });
    console.log(response.text);
  } catch (err: any) {
    console.error("ERROR 2.5 flash config:", err.message);
  }
}

test();
