import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import Razorpay from "razorpay";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database setup
  const db = new Database("lopa_x_ai.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      avatar TEXT,
      credits INTEGER DEFAULT 10,
      subscription_status TEXT DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      chat_type TEXT,
      messages_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tool_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      tool_name TEXT,
      input TEXT,
      output TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generated_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      prompt TEXT,
      image_url TEXT,
      style TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      code TEXT,
      instructions_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  app.use(express.json({ limit: '50mb' })); // Increase limit for game code with base64 assets

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Game Publishing Endpoints
  app.post("/api/games", (req, res) => {
    const { id, userId, title, code, instructions } = req.body;
    try {
      db.prepare("INSERT INTO games (id, user_id, title, code, instructions_json) VALUES (?, ?, ?, ?, ?)").run(
        id, userId, title, code, JSON.stringify(instructions)
      );
      res.json({ success: true, id });
    } catch (error: any) {
      console.error("Save Game Error:", error);
      res.status(500).json({ error: "Failed to save game" });
    }
  });

  app.get("/api/games/:id", (req, res) => {
    try {
      const game = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id) as any;
      if (game) {
        res.json({
          ...game,
          instructions: JSON.parse(game.instructions_json)
        });
      } else {
        res.status(404).json({ error: "Game not found" });
      }
    } catch (error: any) {
      console.error("Get Game Error:", error);
      res.status(500).json({ error: "Failed to retrieve game" });
    }
  });

  // Mock Auth for demo purposes (since we can't do full OAuth without user keys)
  app.post("/api/auth/mock", (req, res) => {
    const { email, name } = req.body;
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (!user) {
      const id = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO users (id, email, name) VALUES (?, ?, ?)").run(id, email, name);
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }
    
    res.json(user);
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    res.json(user);
  });

  app.post("/api/credits/deduct", (req, res) => {
    const { userId, amount } = req.body;
    const user = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as any;
    if (user && user.credits >= amount) {
      db.prepare("UPDATE users SET credits = credits - ? WHERE id = ?").run(amount, userId);
      res.json({ success: true, remaining: user.credits - amount });
    } else {
      res.status(400).json({ success: false, message: "Insufficient credits" });
    }
  });

  // Groq Chat Endpoint
  app.post("/api/chat/groq", async (req, res) => {
    const { messages, model = "llama-3.3-70b-versatile", stream = false } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured on the server." });
    }

    try {
      const { default: Groq } = await import("groq-sdk");
      const groq = new Groq({ apiKey });
      
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const completion = await groq.chat.completions.create({
          messages,
          model,
          stream: true,
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      } else {
        const completion = await groq.chat.completions.create({
          messages,
          model,
        });
        res.json({ content: completion.choices[0]?.message?.content || "" });
      }
    } catch (error: any) {
      console.error("Groq API Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to get response from Groq" });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  });

  // AI Provider Endpoints
  app.post("/api/chat/proxy", async (req, res) => {
    const { messages, provider, model, stream = false } = req.body;
    
    let apiKey = "";
    let apiUrl = "";
    let headers: any = { "Content-Type": "application/json" };
    let body: any = {};

    try {
      switch (provider) {
        case "openrouter":
          apiKey = process.env.OPENROUTER_API_KEY || "";
          apiUrl = "https://openrouter.ai/api/v1/chat/completions";
          headers["Authorization"] = `Bearer ${apiKey}`;
          headers["HTTP-Referer"] = "https://lopa.ai"; // Required by OpenRouter
          headers["X-Title"] = "Lopa X AI";
          body = { model: model || "meta-llama/llama-3.1-8b-instruct:free", messages, stream };
          break;

        case "together":
          apiKey = process.env.TOGETHER_API_KEY || "";
          apiUrl = "https://api.together.xyz/v1/chat/completions";
          headers["Authorization"] = `Bearer ${apiKey}`;
          body = { model: model || "meta-llama/Llama-3-8b-chat-hf", messages, stream };
          break;

        case "sambanova":
          apiKey = process.env.SAMBANOVA_API_KEY || "";
          apiUrl = "https://api.sambanova.ai/v1/chat/completions";
          headers["Authorization"] = `Bearer ${apiKey}`;
          body = { model: model || "Meta-Llama-3.1-8B-Instruct", messages, stream };
          break;

        case "deepai":
          apiKey = process.env.DEEPAI_API_KEY || "";
          apiUrl = "https://api.deepai.org/api/text-generator";
          headers["api-key"] = apiKey;
          // DeepAI uses form-data style or simple params, not standard chat completion
          const lastMessage = messages[messages.length - 1]?.content || "";
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "api-key": apiKey },
            body: new URLSearchParams({ text: lastMessage })
          });
          const data = await response.json();
          return res.json({ content: data.output || "DeepAI failed to respond." });

        case "replicate":
          apiKey = process.env.REPLICATE_API_TOKEN || "";
          // Replicate is complex (async). For a simple proxy, we'll use their official model URLs if possible
          // or just a placeholder for now as it usually requires a webhook or polling.
          // Let's use a common llama model on replicate
          apiUrl = "https://api.replicate.com/v1/predictions";
          headers["Authorization"] = `Token ${apiKey}`;
          body = {
            version: "2d19859030ff705a87c740f710393978b5848c467a9a904c3f9067a19f8a34d9", // Llama 3 70b
            input: { prompt: messages.map((m: any) => `${m.role}: ${m.content}`).join("\n") }
          };
          const repRes = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
          });
          const repData = await repRes.json();
          // Replicate needs polling, but for this demo we'll just return the prediction object
          // and let the client handle it or just show a message.
          return res.json({ content: "Replicate request started. (Polling not implemented in this proxy)", prediction: repData });

        default:
          return res.status(400).json({ error: "Invalid provider" });
      }

      if (!apiKey) {
        return res.status(500).json({ error: `${provider.toUpperCase()}_API_KEY is not configured.` });
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `${provider} API error`);
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error(`Failed to get reader from ${provider} response`);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                res.write('data: [DONE]\n\n');
              } else {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || "";
                  if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                } catch (e) {
                  // Ignore parse errors for partial chunks
                }
              }
            }
          }
        }
        return res.end();
      } else {
        const data = await response.json();
        res.json({ content: data.choices[0]?.message?.content || "" });
      }
    } catch (error: any) {
      console.error(`${provider} Proxy Error:`, error);
      res.status(500).json({ error: error.message || `Failed to get response from ${provider}` });
    }
  });

  // Razorpay Integration
  app.post("/api/payments/create-order", async (req, res) => {
    const { amount, currency = "INR", receipt } = req.body;
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay keys are not configured." });
    }

    try {
      const razorpay = new Razorpay({
        key_id,
        key_secret,
      });

      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ error: error.message || "Failed to create Razorpay order" });
    }
  });

  app.post("/api/payments/verify", async (req, res) => {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      planTitle
    } = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return res.status(500).json({ error: "Razorpay secret is not configured." });
    }

    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      try {
        const status = planTitle.toLowerCase();
        db.prepare("UPDATE users SET subscription_status = ? WHERE id = ?").run(status, userId);
        res.json({ success: true, message: "Payment verified successfully" });
      } catch (error: any) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: "Failed to update user subscription" });
      }
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
