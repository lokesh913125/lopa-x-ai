import { useState, useRef, useEffect } from "react";

export default function ChatPage() {

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage() {

    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: input
        })
      });

      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.reply || "No response"
      };

      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "AI server error." }
      ]);

    }

    setLoading(false);
  }

  function handleKeyDown(e: any) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }

  return (

    <div style={{
      maxWidth: 900,
      margin: "auto",
      height: "80vh",
      display: "flex",
      flexDirection: "column"
    }}>

      <h2 style={{ marginBottom: 10 }}>Lopax AI Chat</h2>

      {/* CHAT AREA */}

      <div style={{
        flex: 1,
        overflowY: "auto",
        border: "1px solid #333",
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        background: "#0f0f0f"
      }}>

        {messages.map((msg, i) => (

          <div
            key={i}
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 10
            }}
          >

            <div
              style={{
                background:
                  msg.role === "user" ? "#6366f1" : "#1f2937",
                padding: "10px 14px",
                borderRadius: 8,
                maxWidth: "70%",
                color: "white"
              }}
            >

              {msg.content}

            </div>

          </div>

        ))}

        {loading && <p>AI is thinking...</p>}

        <div ref={messagesEndRef} />

      </div>

      {/* INPUT */}

      <div style={{ display: "flex", gap: 10 }}>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #333",
            background: "#111",
            color: "white"
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "12px 20px",
            background: "#6366f1",
            border: "none",
            borderRadius: 8,
            color: "white",
            cursor: "pointer"
          }}
        >

          Send

        </button>

      </div>

    </div>

  );
}
