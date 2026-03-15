import { useState, useRef, useEffect } from "react";
import { generateChatResponseStream } from "../services/gemini";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── Web Speech API types ──
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Namaste! Main Lopa X AI hun 🤖 Bolo ya likho — dono kaam karega!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Text to Speech ──
  const speak = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // ── Voice Input ──
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("❌ Tera browser voice input support nahi karta. Chrome use karo!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Hindi + English dono
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);

      // Final result aane pe automatically send karo
      if (event.results[event.results.length - 1].isFinal) {
        setTimeout(() => sendMessage(transcript), 300);
      }
    };

    recognition.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed") {
        setError("❌ Microphone permission do! Browser settings mein allow karo.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ── Send Message ──
  const sendMessage = async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msgText,
    };
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

      // TTS — AI ka jawab bolega
      speak(full);
    } catch (e: any) {
      const msg =
        e?.message?.includes("VITE_")
          ? "❌ API Key missing!"
          : e?.message?.includes("429")
          ? "⚠️ Rate limit! Thodi der baad try karo."
          : `❌ ${e?.message || "Unknown error"}`;
      setError(msg);
      setMessages((p) =>
        p.map((m) =>
          m.id === aId ? { ...m, content: "Kuch problem aayi, dobara try karo." } : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-800">
        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
          🤖
        </div>
        <div>
          <p className="font-semibold">Lopa X AI</p>
          <p className="text-xs text-gray-400">
            {listening ? "🎤 Sun raha hun..." : "Gemini + Fallback"}
          </p>
        </div>

        {/* TTS Toggle */}
        <button
          onClick={() => {
            setTtsEnabled((p) => !p);
            window.speechSynthesis?.cancel();
          }}
          className={`ml-auto text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            ttsEnabled
              ? "border-purple-500 bg-purple-500/20 text-purple-300"
              : "border-gray-600 text-gray-400 hover:border-gray-400"
          }`}
          title="AI ka jawab bol ke sunao"
        >
          {ttsEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
        </button>

        <div
          className={`w-2 h-2 rounded-full ${
            listening
              ? "bg-red-400 animate-pulse"
              : loading
              ? "bg-yellow-400 animate-pulse"
              : "bg-green-400"
          }`}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-xs">
                🤖
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-purple-600 rounded-tr-none"
                  : "bg-gray-700 rounded-tl-none"
              }`}
            >
              {m.content ||
                (loading && m.role === "assistant" ? (
                  <span className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                ) : null)}
            </div>
          </div>
        ))}
        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        {listening && (
          <div className="text-center text-red-400 text-xs mb-2 animate-pulse">
            🎤 Bol raha hai... (rukne pe automatically bhejega)
          </div>
        )}
        <div className="flex gap-2">
          {/* Voice Button */}
          <button
            onClick={listening ? stopListening : startListening}
            disabled={loading}
            className={`px-3 py-2 rounded-xl text-sm transition-all ${
              listening
                ? "bg-red-600 hover:bg-red-700 animate-pulse"
                : "bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
            }`}
            title={listening ? "Rokne ke liye click karo" : "Voice input shuru karo"}
          >
            {listening ? "⏹️" : "🎤"}
          </button>

          <textarea
            rows={1}
            className="flex-1 bg-gray-700 rounded-xl px-4 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={
              listening ? "Sun raha hun..." : "Likho ya mic pe click karo..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
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
  );
}
