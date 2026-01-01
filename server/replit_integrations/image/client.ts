import { GoogleGenAI, Modality } from "@google/genai";
import pool from "../../db";

// Using official Google Gemini API with API key from database
let aiInstance: GoogleGenAI;

async function getAiClient() {
  if (aiInstance) return aiInstance;
  const result = await pool.query("SELECT setting_value FROM admin_settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
  const apiKey = result.rows[0]?.setting_value;
  if (!apiKey) {
    throw new Error('Gemini API key not found in database. Please configure it in the admin panel.');
  }
  aiInstance = new GoogleGenAI(apiKey);
  return aiInstance;
}

/**
 * Generate an image and return as base64 data URL.
 * Uses gemini-2.5-flash-image model via Replit AI Integrations.
 */
export async function generateImage(prompt: string): Promise<string> {
  const ai = await getAiClient();
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    // Note: configuration might vary based on specific SDK version for multimodal
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

