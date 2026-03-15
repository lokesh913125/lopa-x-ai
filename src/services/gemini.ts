// ============================================================
// 🔑 MULTI-PROVIDER AI FALLBACK SYSTEM
// ============================================================

const GEMINI_KEY    = import.meta.env.VITE_GEMINI_API_KEY_1;
const GROQ_KEY      = import.meta.env.VITE_GROQ_API_KEY;
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const TOGETHER_KEY  = import.meta.env.VITE_TOGETHER_API_KEY;
const DEEPSEEK_KEY  = import.meta.env.VITE_DEEPSEEK_API_KEY;
const SAMBANOVA_KEY = import.meta.env.VITE_SAMBANOVA_API_KEY;

// ============================================================
// 🤖 TEXT PROVIDERS
// ============================================================

async function tryGemini(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error("No Gemini key");
  const contents = messages.map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }]
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(systemInstruction && { system_instruction: { parts: [{ text: systemInstruction }] } })
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini empty");
  return text;
}

async function tryGroq(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
  if (!GROQ_KEY) throw new Error("No Groq key");
  const msgs = [
    ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
    ...messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
  ];
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 1024 })
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq empty");
  return text;
}

async function tryOpenRouter(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
  if (!OPENROUTER_KEY) throw new Error("No OpenRouter key");
  const msgs = [
    ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
    ...messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
  ];
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer": "https://lopa-x-ai.vercel.app",
      "X-Title": "Lopa X AI"
    },
    body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct:free", messages: msgs, max_tokens: 1024 })
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter empty");
  return text;
}

async function tryTogether(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
  if (!TOGETHER_KEY) throw new Error("No Together key");
  const msgs = [
    ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
    ...messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
  ];
  const res = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOGETHER_KEY}` },
    body: JSON.stringify({ model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free", messages: msgs, max_tokens: 1024 })
  });
  if (!res.ok) throw new Error(`Together ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Together empty");
  return text;
}

async function tryDeepSeek(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
  if (!DEEPSEEK_KEY) throw new Error("No DeepSeek key");
  const msgs = [
    ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
    ...messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
  ];
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({ model: "deepseek-chat", messages: msgs, max_tokens: 1024 })
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("DeepSeek empty");
  return text;
}

async function trySambaNova(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
  if (!SAMBANOVA_KEY) throw new Error("No SambaNova key");
  const msgs = [
    ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
    ...messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
  ];
  const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SAMBANOVA_KEY}` },
    body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: msgs, max_tokens: 1024 })
  });
  if (!res.ok) throw new Error(`SambaNova ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("SambaNova empty");
  return text;
}

// ============================================================
// 🔄 MAIN FALLBACK CHAIN
// ============================================================
export async function generateChatResponse(
  messages: { role: string; content: string }[],
  systemInstruction?: string,
  _modelName?: string
): Promise<string> {
  const providers = [
    { name: "Gemini",     fn: () => tryGemini(messages, systemInstruction) },
    { name: "Groq",       fn: () => tryGroq(messages, systemInstruction) },
    { name: "OpenRouter", fn: () => tryOpenRouter(messages, systemInstruction) },
    { name: "Together",   fn: () => tryTogether(messages, systemInstruction) },
    { name: "DeepSeek",   fn: () => tryDeepSeek(messages, systemInstruction) },
    { name: "SambaNova",  fn: () => trySambaNova(messages, systemInstruction) },
  ];
  for (const provider of providers) {
    try {
      const result = await provider.fn();
      console.log(`✅ ${provider.name} responded`);
      return result;
    } catch (e) {
      console.warn(`⚠️ ${provider.name} failed:`, e);
    }
  }
  throw new Error("❌ Sab providers fail ho gaye! Thodi der baad try karo.");
}

// ============================================================
// 💬 STREAMING
// ============================================================
export async function* generateChatResponseStream(
  messages: { role: string; content: string }[],
  systemInstruction?: string,
  _modelName?: string
): AsyncGenerator<string> {
  const fullResponse = await generateChatResponse(messages, systemInstruction);
  const words = fullResponse.split(" ");
  for (const word of words) {
    yield word + " ";
    await new Promise(r => setTimeout(r, 15));
  }
}

// ============================================================
// 🎨 IMAGE GENERATION - Pollinations AI (Free)
// ============================================================
export async function generateImage(
  prompt: string,
  aspectRatio: string = "1:1"
): Promise<string> {
  const w = aspectRatio === "16:9" ? 1280 : aspectRatio === "9:16" ? 576 : 1024;
  const h = aspectRatio === "16:9" ? 720  : aspectRatio === "9:16" ? 1024 : 1024;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&enhance=true&seed=${Date.now()}`;
}

// ============================================================
// 🎮 GAME FORGE
// ============================================================
const GAME_PROMPTS: Record<string, string> = {
  adventure: "You are an immersive text adventure game master in a dark fantasy world. Give vivid descriptions and exactly 3 numbered choices each turn. Max 180 words.",
  mystery:   "You are a murder mystery game host. Reveal clues slowly, introduce suspects, let the player investigate. Max 180 words.",
  trivia:    "You are an energetic trivia host. Ask one question at a time from varied categories. Track score. Max 150 words.",
  roleplay:  "You are a creative roleplay game master. Build an immersive story reacting to every choice. Max 200 words.",
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
  code:      "Write clean, well-commented code for the task. Briefly explain it.",
  grammar:   "Fix all grammar/spelling mistakes. Show corrected version and list changes.",
  seo:       "Generate SEO title (60 chars), meta description (155 chars), and 10 keywords.",
  story:     "Write an engaging short story (300-400 words) based on the prompt.",
  email:     "Write a professional email with subject line based on the context.",
  tweet:     "Write 3 tweet variations (under 280 chars each) with relevant hashtags.",
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

// ============================================================
// 🔍 IMAGE ANALYSIS - Multi Provider Vision Fallback
// ============================================================

async function compressImage(base64: string, mimeType: string): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 768;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      resolve({ base64: compressed.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = () => resolve({ base64, mimeType });
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

export async function analyzeImageWithAI(
  base64: string,
  mimeType: string,
  prompt: string
): Promise<string> {

  // Compress pehle — size chhoti karo
  const compressed = await compressImage(base64, mimeType);
  base64   = compressed.base64;
  mimeType = compressed.mimeType;

  // 1️⃣ Gemini Vision
  try {
    if (!GEMINI_KEY) throw new Error("No key");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ]}],
        }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) { console.log("✅ Gemini Vision"); return text; }
    }
    const err = await res.json().catch(() => ({}));
    console.warn("Gemini Vision failed:", err?.error?.message);
  } catch (e) { console.warn("Gemini Vision error:", e); }

  // 2️⃣ Groq Vision
  try {
    if (!GROQ_KEY) throw new Error("No key");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: prompt },
        ]}],
        max_tokens: 1024,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) { console.log("✅ Groq Vision"); return text; }
    }
    console.warn("Groq Vision failed:", res.status);
  } catch (e) { console.warn("Groq Vision error:", e); }

  // 3️⃣ OpenRouter Vision
  try {
    if (!OPENROUTER_KEY) throw new Error("No key");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://lopa-x-ai.vercel.app",
        "X-Title": "Lopa X AI",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-11b-vision-instruct:free",
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: prompt },
        ]}],
        max_tokens: 1024,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) { console.log("✅ OpenRouter Vision"); return text; }
    }
    console.warn("OpenRouter Vision failed:", res.status);
  } catch (e) { console.warn("OpenRouter Vision error:", e); }

  // 4️⃣ Together Vision
  try {
    if (!TOGETHER_KEY) throw new Error("No key");
    const res = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOGETHER_KEY}` },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: prompt },
        ]}],
        max_tokens: 1024,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) { console.log("✅ Together Vision"); return text; }
    }
    console.warn("Together Vision failed:", res.status);
  } catch (e) { console.warn("Together Vision error:", e); }

  // 5️⃣ SambaNova Vision
  try {
    if (!SAMBANOVA_KEY) throw new Error("No key");
    const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SAMBANOVA_KEY}` },
      body: JSON.stringify({
        model: "Llama-3.2-11B-Vision-Instruct",
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: prompt },
        ]}],
        max_tokens: 1024,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) { console.log("✅ SambaNova Vision"); return text; }
    }
    console.warn("SambaNova Vision failed:", res.status);
  } catch (e) { console.warn("SambaNova Vision error:", e); }

  throw new Error("❌ Sab Vision providers fail! F12 → Console mein exact error dekho.");
}
