import { useState } from "react";

const MODELS = [
  { id: "gemini", name: "Gemini" },
  { id: "groq", name: "Groq" },
  { id: "openrouter", name: "OpenRouter" },
  { id: "together", name: "Together" },
  { id: "sambanova", name: "SambaNova" },
  { id: "deepseek", name: "DeepSeek" },
  { id: "replicate", name: "Replicate" },
  { id: "openai", name: "OpenAI GPT" }
];

export default function ChatPage() {

  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("gemini");
  const [loading, setLoading] = useState(false);

  async function askAI() {

    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setMessages((m) => [...m, userMessage]);

    const prompt = message;
    setMessage("");
    setLoading(true);

    try {

      let reply = "";

      // GEMINI
      if (model === "gemini") {

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        const data = await res.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      }

      // GROQ
      if (model === "groq") {

        const res = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model: "llama3-70b-8192",
              messages: [{ role: "user", content: prompt }]
            })
          }
        );

        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || "No response";
      }

      // OPENROUTER
      if (model === "openrouter") {

        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
              model: "deepseek/deepseek-chat",
              messages: [{ role: "user", content: prompt }]
            })
          }
        );

        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || "No response";
      }

      // TOGETHER
      if (model === "together") {

        const res = await fetch(
          "https://api.together.xyz/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_TOGETHER_API_KEY}`
            },
            body: JSON.stringify({
              model: "meta-llama/Llama-3-70b-chat-hf",
              messages: [{ role: "user", content: prompt }]
            })
          }
        );

        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || "No response";
      }

      // SAMBANOVA
      if (model === "sambanova") {

        const res = await fetch(
          "https://api.sambanova.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SAMBANOVA_API_KEY}`
            },
            body: JSON.stringify({
              model: "Meta-Llama-3-70B-Instruct",
              messages: [{ role: "user", content: prompt }]
            })
          }
        );

        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || "No response";
      }

      // DEEPSEEK
      if (model === "deepseek") {

        const res = await fetch(
          "https://api.deepseek.com/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [{ role: "user", content: prompt }]
            })
          }
        );

        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || "No response";
      }

      // OPENAI
      if (model === "openai") {

        const res = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }]
            })
          }
        );

        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || "No response";
      }

      // REPLICATE (placeholder)
      if (model === "replicate") {
        reply = "Replicate model integration pending.";
      }

      setMessages((m) => [...m, { role: "assistant", content: reply }]);

    } catch (err) {

      setMessages((m) => [...m, { role: "assistant", content: "AI Error occurred." }]);

    }

    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>

      <h1>Lopax AI Chat</h1>

      <div style={{ marginBottom: 10 }}>
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setModel(m.id)}
            style={{
              marginRight: 6,
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: model === m.id ? "#6366f1" : "#e5e7eb",
              color: model === m.id ? "white" : "black",
              cursor: "pointer"
            }}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div style={{
        border: "1px solid #ddd",
        height: 400,
        overflow: "auto",
        padding: 10,
        marginBottom: 10
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <b>{m.role === "user" ? "You" : "AI"}:</b> {m.content}
          </div>
        ))}
        {loading && <p>AI is thinking...</p>}
      </div>

      <div style={{ display: "flex" }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything..."
          style={{ flex: 1, padding: 10 }}
        />
        <button
          onClick={askAI}
          style={{ padding: "10px 20px" }}
        >
          Send
        </button>
      </div>

    </div>
  );
}
