export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, model } = req.body;

  try {

    let reply = "";

    // GEMINI
    if (model === "gemini") {

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }]
          })
        }
      );

      const data = await response.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    }

    // GROQ
    if (model === "groq") {

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [{ role: "user", content: message }]
          })
        }
      );

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response";
    }

    // OPENROUTER
    if (model === "openrouter") {

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat",
            messages: [{ role: "user", content: message }]
          })
        }
      );

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response";
    }

    // TOGETHER
    if (model === "together") {

      const response = await fetch(
        "https://api.together.xyz/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`
          },
          body: JSON.stringify({
            model: "meta-llama/Llama-3-70b-chat-hf",
            messages: [{ role: "user", content: message }]
          })
        }
      );

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response";
    }

    // SAMBANOVA
    if (model === "sambanova") {

      const response = await fetch(
        "https://api.sambanova.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`
          },
          body: JSON.stringify({
            model: "Meta-Llama-3-70B-Instruct",
            messages: [{ role: "user", content: message }]
          })
        }
      );

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response";
    }

    // DEEPSEEK
    if (model === "deepseek") {

      const response = await fetch(
        "https://api.deepseek.com/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: message }]
          })
        }
      );

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response";
    }

    // OPENAI
    if (model === "openai") {

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: message }]
          })
        }
      );

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response";
    }

    res.status(200).json({ reply });

  } catch (error) {

    res.status(500).json({ error: "AI router error" });

  }

}
