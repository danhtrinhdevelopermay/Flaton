import pool from "../../db";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Using official Google Gemini API with API key from database
export class GoogleGenAI {
  apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  getGenerativeModel(config: { model: string }) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    return genAI.getGenerativeModel(config);
  }
  // Added for compatibility with direct .generateContent calls
  async generateContent(args: any) {
    const model = this.getGenerativeModel({ model: "gemini-1.5-flash" });
    return model.generateContent(args);
  }
}

// Initial dummy instance that will be replaced once getAiClient is called
let aiInstance: GoogleGenAI;

async function getAiClient() {
  if (aiInstance) return aiInstance;
  const result = await pool.query("SELECT setting_value FROM admin_settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
  const apiKey = result.rows[0]?.setting_value || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please configure it in the admin panel.');
  }
  aiInstance = new GoogleGenAI(apiKey);
  return aiInstance;
}

export const ai: any = {
  getGenerativeModel: (config: any) => {
    return {
      generateContent: async (args: any) => {
        const client = await getAiClient();
        return client.getGenerativeModel(config).generateContent(args);
      }
    };
  },
  generateContent: async (args: any) => {
    const client = await getAiClient();
    return client.generateContent(args);
  }
};

/**
 * Generate an image and return as base64 data URL.
 */
export async function generateImage(prompt: string): Promise<string> {
  const aiClient = await getAiClient();
  const model = aiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const candidate = response.response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: any) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

