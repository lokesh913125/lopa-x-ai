import { useState, useRef, useEffect } from "react";
import { generateChatResponseStream } from "../services/gemini";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const STORAGE_KEY = "lopax_chat_history";
const MAX_SESSIONS = 20;

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "assistant", content: "Namaste! Main Lopa X AI hun 🤖 Bolo ya likho!", timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto save current session ──
  useEffect(() => {
    if (messages.length <= 1) return;
    const title =
      messages.find((m) => m.role === "user")?.content.slice(0, 40) || "New Chat";

    if (activeId) {
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === activeId ? { ...s, messages, title } : s
        );
        saveSessions(updated);
        return updated;
      });
    } else {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title,
        messages,
        createdAt: Date.now(),
      };
      setActiveId(newSession.id);
      setSessions((prev) => {
        const updated = [newSession, ...prev];
        saveSessions(updated);
        return updated;
      });
    }
  }, [messages]);

  // ── Load session ──
  const loadSession = (session: ChatSession) => {
    setActiveId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
  };

  // ── New Chat ──
  const newChat = () => {
    setActiveId(null);
    setMessages([
      { id: "0", role: "assistant", content: "Namaste! Main Lopa X AI hun 🤖 Naya conversation shuru karo!", timestamp: Date.now() },
    ]);
    setShowHistory(false);
  };

  // ── Delete session ──
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
    if (activeId === id) newChat();
  };

  // ── TTS ──
  const speak = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    window.speechSynthesis.speak(u);
  };

  // ── Voice Input ──
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setError("❌ Chrome use karo voice ke liye!");
    const r = new SR();
    r.lang = "hi-IN";
    r.interimResults = true;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e: any) => {
      const t = Array.from(e.results).map((x: any) => x[0].transcript).join("");
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) setTimeout(() => sendMessage(t), 300);
    };
    r.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed") setError("❌ Mic permission do!");
    };
    recognitionRef.current = r;
    r.start();
  };

  // ── Send ──
  const sendMessage = async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msgText, timestamp: Date.now() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    const aId = (Date.now() + 1).toString();
    setMessages((p) => [...p, { id: aId, role: "assistant", content: "", timestamp: Date.now() }]);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      let full = "";
      for await (const chunk of generateChatResponseStream(history)) {
        full += chunk;
        setMessages((p) => p.map((m) => (m.id === aId ? { ...m, content: full } : m)));
      }
      speak(full);
    } catch (e: any) {
      setError(`❌ ${e?.message || "Error aaya!"}`);
      setMessages((p) => p.map((m) => (m.id === aId ? { ...m, content: "Kuch problem aayi." } : m)));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("hi-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">

      {/* ── History Sidebar ── */}
      {showHistory && (
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <span className="font-semibold text-sm">Chat History</span>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
          </div>

          <button
            onClick={newChat}
            className="mx-3 mt-3 py-2 rounded-lg border border-dashed border-gray-600 hover:border-purple-500 text-gray-400 hover:text-purple-400 text-sm transition-colors"
          >
            + New Chat
          </button>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
            {sessions.length === 0 && (
              <p className="text-gray-500 text-xs text-center mt-8">Abhi koi history nahi</p>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => loadSession(s)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeId === s.id ? "bg-purple-600/30 border border-purple-500/50" : "hover:bg-gray-700"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.title}</p>
                  <p className="text-[10px] text-gray-500">{formatTime(s.createdAt)}</p>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 ml-2 text-sm transition-opacity"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Chat ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-700 bg-gray-800">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg text-sm transition-colors ${showHistory ? "bg-purple-600/30 text-purple-300" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
            title="Chat History"
          >
            🕐
          </button>

          <button
            onClick={newChat}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 text-sm transition-colors"
            title="New Chat"
          >
            ✏️
          </button>

          <div className="flex items-center gap-2 ml-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-xs">🤖</div>
            <div>
              <p className="font-semibold text-sm">Lopa X AI</p>
              <p className="text-[10px] text-gray-400">{listening ? "🎤 Sun raha hun..." : `${sessions.length} chats saved`}</p>
            </div>
          </div>

          <button
            onClick={() => { setTtsEnabled((p) => !p); window.speechSynthesis?.cancel(); }}
            className={`ml-auto text-xs px-2 py-1.5 rounded-lg border transition-colors ${ttsEnabled ? "border-purple-500 bg-purple-500/20 text-purple-300" : "border-gray-600 text-gray-400 hover:border-gray-400"}`}
          >
            {ttsEnabled ? "🔊 On" : "🔇 Off"}
          </button>

          <div className={`w-2 h-2 rounded-full ${listening ? "bg-red-400 animate-pulse" : loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
              )}
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-purple-600 rounded-tr-none" : "bg-gray-700 rounded-tl-none"
              }`}>
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

        {/* Input */}
        <div className="p-3 bg-gray-800 border-t border-gray-700">
          {listening && <div className="text-center text-red-400 text-xs mb-2 animate-pulse">🎤 Bol raha hai...</div>}
          <div className="flex gap-2">
            <button
              onClick={listening ? () => recognitionRef.current?.stop() : startListening}
              disabled={loading}
              className={`px-3 py-2 rounded-xl text-sm transition-all ${listening ? "bg-red-600 animate-pulse" : "bg-gray-700 hover:bg-gray-600 disabled:opacity-40"}`}
            >
              {listening ? "⏹️" : "🎤"}
            </button>

            <textarea
              rows={1}
              className="flex-1 bg-gray-700 rounded-xl px-4 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Likho ya mic pe click karo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={loading}
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 px-4 rounded-xl text-sm transition-colors"
            >
              {loading ? "..." : "➤"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
