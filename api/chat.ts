export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, model } = req.body;

  let reply = "";

  try {

    // GEMINI
    if (model === "gemini") {

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: message }]
              }
            ]
          })
        }
      );

      const data = await response.json();

      reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from Gemini";

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
            messages: [
              {
                role: "user",
                content: message
              }
            ]
          })
        }
      );

      const data = await response.json();

      reply =
        data?.choices?.[0]?.message?.content ||
        "No response from OpenAI";

    }

    if (!reply) {
      reply = "Model not responding.";
    }

    return res.status(200).json({ reply });

  } catch (error) {

    console.error("AI Error:", error);

    return res.status(500).json({
      error: "AI server error"
    });

  }

}

