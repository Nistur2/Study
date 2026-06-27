const express  = require("express");
const path     = require("path");
const pdfParse = require("pdf-parse");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── Extract text from base64-encoded PDF ─────────────────────────────────────
async function extractPdf(base64) {
  const buffer = Buffer.from(base64, "base64");
  const parsed = await pdfParse(buffer);
  return parsed.text.slice(0, 12000); // cap to avoid token overflow
}

// ── Convert Anthropic-style content blocks → plain text for Groq ─────────────
async function toText(blocks) {
  if (!Array.isArray(blocks)) return String(blocks);
  const parts = [];
  for (const b of blocks) {
    if (b.type === "text") {
      parts.push(b.text);
    } else if (b.type === "document" && b.source?.media_type === "application/pdf") {
      const text = await extractPdf(b.source.data);
      parts.push(`[PDF Content]\n${text}`);
    } else if (b.type === "image") {
      parts.push("[An image was uploaded — describe and generate content based on any visible text or diagrams.]");
    }
  }
  return parts.join("\n\n");
}

// ── Groq proxy ────────────────────────────────────────────────────────────────
app.post("/api/messages", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: "GROQ_API_KEY is not set." } });

  try {
    const { system, messages, max_tokens } = req.body;
    const userText = await toText(messages?.[0]?.content || []);

    const body = {
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: max_tokens || 2000,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: userText },
      ],
    };

    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (data.error) {
      console.error("[groq error]", data.error);
      return res.status(400).json({ error: { message: data.error.message } });
    }

    // Return in Anthropic format so the frontend needs zero changes
    const text = data.choices?.[0]?.message?.content || "";
    res.json({ content: [{ type: "text", text }] });

  } catch (err) {
    console.error("[proxy error]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

// ── AI Tutor — multi-turn chat ────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: "GROQ_API_KEY is not set." } });

  try {
    const { fileBlocks, messages, language } = req.body;

    // Extract file content to embed as context
    const fileText = await toText(fileBlocks || []);
    const lang     = language && language !== "English" ? `Always respond in ${language}.` : "";

    const systemPrompt = `${lang}
You are an expert AI study tutor. The student has uploaded the following study material:

---
${fileText.slice(0, 10000)}
---

Your responsibilities:
- Answer questions about the material clearly and concisely
- Explain difficult concepts using simple examples
- Quiz the student interactively when asked
- Summarize sections on request
- Be encouraging, patient, and supportive
- Stay focused on the uploaded content
- If asked something unrelated, gently redirect back to the material
- Keep responses focused — not too long unless detail is needed`.trim();

    const body = {
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages || []),
      ],
    };

    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    if (data.error) return res.status(400).json({ error: { message: data.error.message } });

    res.json({ reply: data.choices?.[0]?.message?.content || "" });
  } catch (err) {
    console.error("[chat error]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✦ StudyAI (Groq) → http://localhost:${PORT}`));
