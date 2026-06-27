const express = require("express");
const path    = require("path");

const app = express();

// Support large payloads (base64-encoded PDFs / images)
app.use(express.json({ limit: "50mb" }));

// Serve built React frontend
app.use(express.static(path.join(__dirname, "public")));

// ── Anthropic proxy ──────────────────────────────────────────────────────────
// The API key never reaches the browser — it lives only here.
app.post("/api/messages", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY is not set." } });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":    "application/json",
        "x-api-key":       apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[proxy error]", err.message);
    res.status(500).json({ error: { message: "Upstream request failed." } });
  }
});

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✦ StudyAI → http://localhost:${PORT}`));
