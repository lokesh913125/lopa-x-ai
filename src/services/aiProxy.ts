export async function* generateProxyResponseStream(
  messages: { role: string; content: string }[],
  provider: string,
  model?: string
) {
  const response = await fetch("/api/chat/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, provider, model, stream: true }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to get response from ${provider}`);
  }

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
          if (parsed.error) throw new Error(parsed.error);
        } catch (e) {
          // Ignore parse errors for partial chunks
        }
      }
    }
  }
}

export async function generateProxyResponse(
  messages: { role: string; content: string }[],
  provider: string,
  model?: string
) {
  const response = await fetch("/api/chat/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, provider, model, stream: false }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to get response from ${provider}`);
  }

  const data = await response.json();
  return data.content;
}
