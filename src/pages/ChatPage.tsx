import { useState, useRef, useEffect } from "react";
import { generateChatResponseStream } from "../services/gemini";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Namaste! Main Lopa X AI hun 🤖 Kya jaanna chahte ho?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    const aId = (Date.now() + 1).toString();
    setMessages((p) => [...p, { id: aId, role: "assistant", content: "" }]);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let full = "";
      for await (const chunk of generateChatResponseStream(history)) {
        full += chunk;
        setMessages((p) =>
          p.map((m) => (m.id === aId ? { ...m, content: full } : m))
        );
      }
    } catch (e: any) {
      const msg = e?.message?.includes("API key") || e?.message?.includes("VITE_")
        ? "❌ API Key missing! Vercel mein VITE_GEMINI_API_KEY_1 add karo."
        : e?.message?.includes("quota") || e?.message?.includes("429")
        ? "⚠️ Rate limit! Thodi der baad try karo."
        : `❌ ${e?.message || "Unknown error"}`;
      setError(msg);
      setMessages((p) =>
        p.map((m) => (m.id === aId ? { ...m, content: "Kuch problem aayi, dobara try karo." } : m))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-800">
        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">🤖</div>
        <div>
          <p className="font-semibold">Lopa X AI</p>
          <p className="text-xs text-gray-400">Gemini 1.5 Flash</p>
        </div>
        <div className={`ml-auto w-2 h-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-purple-600 rounded-tr-none"
                  : "bg-gray-700 rounded-tl-none"
              }`}
            >
              {m.content || (loading && m.role === "assistant" ? (
                <span className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              ) : null)}
            </div>
          </div>
        ))}
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
        <textarea
          rows={1}
          className="flex-1 bg-gray-700 rounded-xl px-4 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Kuch bhi poochho... (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 px-4 rounded-xl text-sm transition-colors"
        >
          {loading ? "..." : "➤"}
        </button>
      </div>
    </div>
  );
}
