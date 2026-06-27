const express = require("express");
const path    = require("path");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── Transform Anthropic-style blocks → Gemini parts ──────────────────────────
function toGeminiParts(blocks) {
  if (!Array.isArray(blocks)) return [{ text: String(blocks) }];
  return blocks.map(b => {
    if (b.type === "text")     return { text: b.text };
    if (b.type === "document") return { inline_data: { mime_type: b.source.media_type, data: b.source.data } };
    if (b.type === "image")    return { inline_data: { mime_type: b.source.media_type, data: b.source.data } };
    return { text: "" };
  }).filter(p => p.text !== "" || p.inline_data);
}

// ── Gemini proxy ──────────────────────────────────────────────────────────────
// Accepts Anthropic-format requests from the frontend, converts to Gemini,
// returns Anthropic-format response — frontend needs zero changes.
app.post("/api/messages", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: "GEMINI_API_KEY is not set." } });

  try {
    const { system, messages, max_tokens } = req.body;
    const userBlocks = messages?.[0]?.content || [];
    const parts      = toGeminiParts(userBlocks);

    const geminiBody = {
      ...(system && { system_instruction: { parts: [{ text: system }] } }),
      contents: [{ role: "user", parts }],
      generationConfig: {
        maxOutputTokens: max_tokens || 2000,
        temperature: 0.3,
      },
    };

    const model = "gemini-1.5-flash";
    const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const upstream = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(geminiBody),
    });

    const data = await upstream.json();

    if (data.error) {
      console.error("[gemini error]", data.error);
      return res.status(400).json({ error: { type: data.error.status, message: data.error.message } });
    }

    // Transform Gemini response → Anthropic format so the frontend stays unchanged
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ content: [{ type: "text", text }] });

  } catch (err) {
    console.error("[proxy error]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✦ StudyAI (Gemini) → http://localhost:${PORT}`));
