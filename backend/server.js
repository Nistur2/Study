const express = require("express");
const path    = require("path");

const app    = express();
const SOLANA = process.env.SOLANA_ENGINE_URL || "http://solana-engine:8000";

app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── Helper: decode Anthropic-style content blocks into Solana fields ──────────
function parseBlocks(blocks) {
  let file_data = "", file_mime = "text/plain", file_name = "document";
  const textParts = [];

  for (const b of (blocks || [])) {
    if (b.type === "document") {
      file_data = b.source.data;
      file_mime = b.source.media_type;
      file_name = "document.pdf";
    } else if (b.type === "image") {
      file_data = b.source.data;
      file_mime = b.source.media_type;
      file_name = "image";
    } else if (b.type === "text") {
      textParts.push(b.text);
    }
  }

  // Text files: encode as base64
  if (!file_data && textParts.length) {
    file_data = Buffer.from(textParts.join("\n")).toString("base64");
    file_mime = "text/plain";
    file_name = "document.txt";
  }

  return { file_data, file_mime, file_name };
}

// ── POST /api/messages — generate quiz, notes, flashcards, summary, blanks ───
app.post("/api/messages", async (req, res) => {
  try {
    const { mode, difficulty, language, messages } = req.body;
    const blocks = messages?.[0]?.content || [];
    const { file_data, file_mime, file_name } = parseBlocks(
      Array.isArray(blocks) ? blocks : []
    );

    const resp = await fetch(`${SOLANA}/generate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, file_data, file_mime, file_name, difficulty, language }),
    });

    const data = await resp.json();
    if (data.detail) throw new Error(data.detail);
    res.json(data);
  } catch (err) {
    console.error("[solana generate error]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

// ── POST /api/chat — AI Tutor multi-turn conversation ────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { fileBlocks, messages, language } = req.body;
    const { file_data, file_mime, file_name } = parseBlocks(fileBlocks || []);

    const resp = await fetch(`${SOLANA}/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_data, file_mime, file_name, messages, language }),
    });

    const data = await resp.json();
    if (data.detail) throw new Error(data.detail);
    res.json(data);
  } catch (err) {
    console.error("[solana chat error]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

// ── GET /api/health — Solana Engine health check ─────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    const resp = await fetch(`${SOLANA}/health`);
    const data = await resp.json();
    res.json({ backend: "ok", solana: data });
  } catch {
    res.status(503).json({ backend: "ok", solana: "unreachable" });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✦ StudyAI Backend (Solana) → http://localhost:${PORT}`));
