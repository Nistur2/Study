# StudyAI 🎓

Upload any file and instantly generate a **Quiz**, **Study Notes**, **Flashcards**, **TL;DR Summary**, or **Fill-in-the-Blank** exercises — powered by Claude AI.

---

## Quick Start (Docker)

### 1. Get your Anthropic API key
Go to https://console.anthropic.com and copy your API key.

### 2. Set up your environment
```bash
cp .env.example .env
# Open .env and paste your API key
```

### 3. Build and run
```bash
docker compose up --build
```

Open **http://localhost:3000** in your browser. That's it.

---

## Project Structure

```
studyai-docker/
├── Dockerfile              # Multi-stage build (React → Express)
├── docker-compose.yml      # One-command deployment
├── .env.example            # Copy to .env and add your API key
├── .dockerignore
├── backend/
│   ├── server.js           # Express server + Anthropic API proxy
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        └── App.jsx         # Full StudyAI React app
```

---

## How it works

```
Browser → Express (port 3000)
              ├── GET  /*           → serves built React app
              └── POST /api/messages → proxies to Anthropic API
                                       (API key stays server-side)
```

The Anthropic API key **never reaches the browser** — it lives only in your `.env` file and is injected into the Express container at runtime.

---

## Features

| Feature | Description |
|---|---|
| 📄 Multi-file upload | Up to 3 files — PDF, images, TXT, Markdown |
| ❓ Quiz | 5 MCQ with difficulty selector + 90s timer + retry missed |
| 📖 Notes | Structured sections, key points, key terms glossary |
| 🃏 Flashcards | Flip cards with progress dots + navigation |
| ⚡ TL;DR | 5-bullet executive summary + key takeaway |
| ✏️ Fill Blanks | Cloze-deletion exercises with instant scoring |
| 🌐 Language | Generate output in 10 languages |
| ⬇ Download | Export any result as an HTML file (printable as PDF) |
| 🔗 Share | Base64 share code — paste on any instance to load a result |
| 🕐 History | Last 15 sessions saved in localStorage |

---

## Local Development (without Docker)

**Terminal 1 — Backend:**
```bash
cd backend
npm install
ANTHROPIC_API_KEY=your_key_here npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 and proxies `/api` calls to the backend on port 3000.

---

## Deploying to the internet

### Option A — Any VPS (DigitalOcean, Hetzner, AWS EC2)
```bash
git clone <your-repo>
cd studyai-docker
cp .env.example .env   # add your API key
docker compose up -d --build
```
Then point your domain's A record to the server IP and add an Nginx reverse proxy or Caddy for HTTPS.

### Option B — Railway / Render
1. Push to GitHub
2. Create a new service from the repo
3. Set `ANTHROPIC_API_KEY` as an environment variable
4. Deploy — they handle HTTPS automatically

### Option C — Fly.io
```bash
fly launch
fly secrets set ANTHROPIC_API_KEY=your_key_here
fly deploy
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Set to `production` in Docker |

---

## Stopping the app
```bash
docker compose down
```
