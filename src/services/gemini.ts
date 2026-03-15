import { GoogleGenAI } from "@google/genai";

// ============================================================
// 🔑 API KEY ROTATION SYSTEM
// ============================================================
const API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY_6,
  import.meta.env.VITE_GEMINI_API_KEY_7,
  import.meta.env.VITE_GEMINI_API_KEY_8,
].filter(Boolean) as string[];

let keyIndex = 0;

function getKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error("❌ VITE_GEMINI_API_KEY_1 Vercel env mein add karo!");
  }
  const key = API_KEYS[keyIndex % API_KEYS.length];
  keyIndex = (keyIndex + 1) % API_KEYS.length;
  return key;
}

function getClient() {
  return new GoogleGenAI({ apiKey: getKey() });
}

// ============================================================
// 💬 CHAT - Normal Response
// ============================================================
export async function generateChatResponse(
  messages: { role: string; content: string }[],
  systemInstruction?: string,
  modelName: string = "gemini-1.5-flash"
): Promise<string> {
  const ai = getClient();
  const contents = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  return response.text ?? "";
}

// ============================================================
// 💬 CHAT - Streaming Response
// ============================================================
export async function* generateChatResponseStream(
  messages: { role: string; content: string }[],
  systemInstruction?: string,
  modelName: string = "gemini-1.5-flash"
): AsyncGenerator<string> {
  const ai = getClient();
  const contents = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  const stream = await ai.models.generateContentStream({
    model: modelName,
    contents,
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

// ============================================================
// 🎨 IMAGE GENERATION
// ============================================================
export async function generateImage(
  prompt: string,
  aspectRatio: string = "1:1"
): Promise<string> {
  try {
    const key = getKey();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio },
        }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
      if (b64) return `data:image/png;base64,${b64}`;
    }
  } catch (_) {}

  // Free fallback - Pollinations AI
  const w = aspectRatio === "16:9" ? 1280 : aspectRatio === "9:16" ? 576 : 1024;
  const h = aspectRatio === "16:9" ? 720 : aspectRatio === "9:16" ? 1024 : 1024;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&enhance=true`;
}

// ============================================================
// 🎮 GAME FORGE
// ============================================================
const GAME_PROMPTS: Record<string, string> = {
  adventure: "You are an immersive text adventure game master in a dark fantasy world. Give vivid descriptions and exactly 3 numbered choices each turn. Max 180 words.",
  mystery: "You are a murder mystery game host. Reveal clues slowly, introduce suspects, let the player investigate. Max 180 words.",
  trivia: "You are an energetic trivia host. Ask one question at a time from varied categories. Track score. Max 150 words.",
  roleplay: "You are a creative roleplay game master. Build an immersive story reacting to every choice. Max 200 words.",
};

export async function generateGameResponse(
  gameType: string,
  userInput: string,
  history: { role: string; content: string }[]
): Promise<string> {
  return generateChatResponse(
    [...history, { role: "user", content: userInput }],
    GAME_PROMPTS[gameType] ?? "You are a fun interactive game AI. Keep responses concise."
  );
}

// ============================================================
// 🛠️ AI TOOLS
// ============================================================
export type ToolType = "summarize" | "translate" | "code" | "grammar" | "seo" | "story" | "email" | "tweet";

const TOOL_PROMPTS: Record<ToolType, string> = {
  summarize: "Summarize the following text in clear bullet points. Be concise.",
  translate: "Translate to Hindi. Also show English translation below.",
  code: "Write clean, well-commented code for the task. Briefly explain it.",
  grammar: "Fix all grammar/spelling mistakes. Show corrected version and list changes.",
  seo: "Generate SEO title (60 chars), meta description (155 chars), and 10 keywords.",
  story: "Write an engaging short story (300-400 words) based on the prompt.",
  email: "Write a professional email with subject line based on the context.",
  tweet: "Write 3 tweet variations (under 280 chars each) with relevant hashtags.",
};

export async function runAITool(toolType: ToolType, userInput: string): Promise<string> {
  return generateChatResponse(
    [{ role: "user", content: userInput }],
    TOOL_PROMPTS[toolType]
  );
}

// ============================================================
// 🔞 ADULT CHAT (18+)
// ============================================================
export async function generateAdultChatResponse(
  messages: { role: string; content: string }[]
): Promise<string> {
  return generateChatResponse(
    messages,
    "You are a fun, flirtatious adult conversation partner for users 18+. Be playful and witty. Do NOT generate explicit sexual content. Keep it tasteful and engaging."
  );
}

// ============================================================
// 🔄 PROXY REPLACEMENT
// ============================================================
export async function generateProxyResponse(
  messages: { role: string; content: string }[],
  _provider: string,
  _model?: string
): Promise<string> {
  return generateChatResponse(messages);
}

export async function* generateProxyResponseStream(
  messages: { role: string; content: string }[],
  _provider: string,
  _model?: string
): AsyncGenerator<string> {
  yield* generateChatResponseStream(messages);
}
