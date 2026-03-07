import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiModel = "gemini-3-flash-preview";

export async function generateChatResponse(messages: { role: string; content: string }[], systemInstruction?: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction,
    }
  });
  return response.text;
}

export async function* generateChatResponseStream(messages: { role: string; content: string }[], systemInstruction?: string) {
  const response = await ai.models.generateContentStream({
    model: geminiModel,
    contents: messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction,
    }
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function generateImage(
  prompt: string, 
  aspectRatio: string = "1:1", 
  model: string = "gemini-2.5-flash-image",
  imageSize: string = "1K",
  customApiKey?: string
) {
  const apiKeyToUse = customApiKey || process.env.GEMINI_API_KEY || "";
  const client = new GoogleGenAI({ apiKey: apiKeyToUse });
  
  const response = await client.models.generateContent({
    model: model,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: imageSize as any,
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
