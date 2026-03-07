export async function generateGroqResponse(messages: { role: string; content: string }[], model: string = "llama-3.3-70b-versatile") {
  const response = await fetch("/api/chat/groq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model, stream: false }),
  });
  if (!response.ok) throw new Error("Failed to get response from Groq");
  const data = await response.json();
  return data.content;
}

export async function* generateGroqResponseStream(messages: { role: string; content: string }[], model: string = "llama-3.3-70b-versatile") {
  const response = await fetch("/api/chat/groq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model, stream: true }),
  });

  if (!response.ok) throw new Error("Failed to get response from Groq");

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) yield parsed.content;
        } catch (e) {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
}
