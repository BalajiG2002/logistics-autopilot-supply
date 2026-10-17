import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const MODEL_NAME = 'gemini-3.8-flash';

// Helper to safely execute Gemini prompt with graceful fallback
export async function generateGeminiContent(options: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
}): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  try {
    const config: any = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }
    if (options.responseSchema) {
      config.responseSchema = options.responseSchema;
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: options.contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    return response.text ?? null;
  } catch (error: any) {
    console.warn('[Gemini Service] API call note (using fallback if needed):', error.message || error);
    return null;
  }
}
