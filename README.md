# StudyAI — Powered by Solana

> A fully self-hosted AI study platform. No external APIs. No subscriptions.
> Solana is the exclusive AI engine — built in, owned by you.

---

## What is Solana?

**Solana** is the platform's built-in AI engine. It runs entirely on your own infrastructure using open-source large language models via Ollama. It understands your uploaded documents through a RAG (Retrieval-Augmented Generation) pipeline and generates quizzes, notes, flashcards, summaries, fill-in-the-blank exercises, and answers your questions — all with source references.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        StudyAI Platform                      │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌─────────────────────┐   │
│  │ Frontend │───▶│ Backend  │───▶│   Solana Engine     │   │
│  │  React   │    │ Express  │    │   (FastAPI + RAG)   │   │
│  └──────────┘    └──────────┘    └──────────┬──────────┘   │
│                                             │               │
│                              ┌──────────────┼────────────┐  │
│                              │              │            │  │
│                         ┌────▼────┐  ┌─────▼────┐       │  │
│                         │ Ollama  │  │ ChromaDB │       │  │
│                         │  LLM   │  │ Vectors  │       │  │
│                         └─────────┘  └──────────┘       │  │
│                                                          │  │
│  ┌──────────────┐    ┌──────────┐    ┌────────────────┐ │  │
│  │   Solana     │    │ PostgreS │    │     Redis      │ │  │
│  │  Training    │    │    QL    │    │    (Cache)     │ │  │
│  └──────────────┘    └──────────┘    └────────────────┘ │  │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
studyai-solana/
├── docker-compose.yml          # Full platform orchestration
├── .env.example                # Environment variable template
├── init-ollama.sh              # Pull default LLM model
│
├── frontend/                   # React application
│   ├── src/App.jsx             # Main UI — all 6 modes
│   ├── nginx.conf              # Nginx proxy config
│   └── Dockerfile
│
├── backend/                    # Express.js API gateway
│   ├── server.js               # Routes to Solana Engine
│   └── Dockerfile
│
├── solana-engine/              # 🌟 Core Solana AI Engine
│   ├── main.py                 # FastAPI application
│   ├── document_processor.py  # PDF/text extraction
│   ├── rag.py                  # RAG pipeline (ChromaDB + embeddings)
│   ├── generator.py            # LLM generation via Ollama
│   ├── requirements.txt
│   └── Dockerfile
│
├── solana-training/            # 🎓 Solana Training Module
│   ├── train.py                # LoRA/QLoRA fine-tuning
│   ├── dataset_prep.py         # Dataset preparation tools
│   ├── evaluate.py             # Model evaluation
│   ├── requirements.txt
│   └── Dockerfile
│
├── datasets/                   # Training datasets (JSONL format)
├── trained-models/             # Fine-tuned model checkpoints
├── embeddings/                 # Cached document embeddings
├── vector-db/                  # ChromaDB persistent storage
└── training-scripts/           # Custom training utilities
```

---

## Quick Start

### 1. Clone and configure

```bash
git clone <your-repo>
cd studyai-solana
cp .env.example .env
```

### 2. Start all services

```bash
docker compose up --build -d
```

### 3. Pull the Solana LLM model

```bash
bash init-ollama.sh
```

### 4. Open the app

```
http://localhost:3000
```

That's it. Solana is running.

---

## Supported LLM Models

Change `OLLAMA_MODEL` in your `.env` file to switch models. No code changes needed.

| Model | Size | Best for |
|---|---|---|
| `llama3.2` | 3B | Default — fast, balanced |
| `llama3.1:8b` | 8B | Higher quality output |
| `qwen2.5:7b` | 7B | Best structured JSON output |
| `mistral:7b` | 7B | Fast, efficient |
| `gemma2:9b` | 9B | Google model, strong reasoning |
| `phi3:mini` | 3.8B | Lightweight, resource-friendly |

To pull a new model:
```bash
docker compose exec ollama ollama pull qwen2.5:7b
# Then update .env: OLLAMA_MODEL=qwen2.5:7b
docker compose restart solana-engine
```

---

## Solana Training Module

Train and fine-tune Solana on your own educational datasets.

### Dataset format (JSONL)

Each line in a `.jsonl` file must be:
```json
{
  "system": "You are Solana, an expert educational AI.",
  "instruction": "Generate a quiz about photosynthesis...",
  "output": "{\"title\": \"...\", \"questions\": [...]}"
}
```

### Add your dataset

Place `.jsonl` files in the `/datasets` folder:
```bash
cp my_dataset.jsonl datasets/
```

Generate a sample dataset to see the format:
```bash
docker compose run --rm solana-training python dataset_prep.py --generate-sample --output /app/datasets/sample.jsonl
```

### Start training

```bash
docker compose --profile training run solana-training python train.py \
  --base-model meta-llama/Llama-3.2-3B-Instruct \
  --epochs 3 \
  --lora-r 16
```

For a specific HuggingFace model (requires HF_TOKEN for gated models):
```bash
# Set in .env: HF_TOKEN=hf_xxxxxxxxxxxx
docker compose --profile training run solana-training python train.py \
  --base-model Qwen/Qwen2.5-7B-Instruct
```

### Resume from checkpoint

```bash
docker compose --profile training run solana-training python train.py \
  --resume-from /app/trained-models/solana-20240601-120000
```

### Evaluate the model

```bash
docker compose --profile training run solana-training python evaluate.py \
  --model /app/trained-models/solana-20240601-120000
```

Interactive session:
```bash
docker compose --profile training run solana-training python evaluate.py \
  --model /app/trained-models/solana-20240601-120000 \
  --interactive
```

### Deploy a trained model

After training, create an Ollama model from the checkpoint:

```bash
# 1. Export weights to GGUF (requires llama.cpp)
docker compose exec solana-training python -c "
from peft import PeftModel
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-3.2-3B-Instruct')
model = PeftModel.from_pretrained(model, '/app/trained-models/solana-20240601')
model.merge_and_unload().save_pretrained('/app/trained-models/solana-merged')
"

# 2. Create Ollama Modelfile
cat > Modelfile << 'EOF'
FROM /app/trained-models/solana-merged
SYSTEM "You are Solana, the AI engine of StudyAI."
EOF

# 3. Register with Ollama
docker compose exec ollama ollama create solana -f Modelfile

# 4. Update .env
echo "OLLAMA_MODEL=solana" >> .env
docker compose restart solana-engine
```

---

## RAG Pipeline

Every document uploaded goes through Solana's RAG pipeline:

```
Upload PDF/TXT/Image
       │
       ▼
 Extract text (pdfplumber)
       │
       ▼
 Chunk into 400-word segments
       │
       ▼
 Generate embeddings (all-MiniLM-L6-v2)
       │
       ▼
 Store in ChromaDB (vector DB)
       │
       ▼
 Query: retrieve top-6 relevant chunks
       │
       ▼
 Build prompt with context + source refs
       │
       ▼
 Ollama generates structured JSON output
       │
       ▼
 Frontend renders Quiz / Notes / etc.
```

---

## GPU Support

For GPU acceleration, uncomment in `docker-compose.yml`:

```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
```

Requires: NVIDIA GPU + Docker NVIDIA runtime installed.

---

## Service Ports

| Service | Port | Description |
|---|---|---|
| Frontend | 3000 | React application |
| Backend | 4000 | Express API |
| Solana Engine | 8000 | FastAPI + RAG |
| Ollama | 11434 | LLM inference |
| ChromaDB | 8080 | Vector database |
| PostgreSQL | 5432 | Session storage |
| Redis | 6379 | Cache |

---

## Health Check

```bash
curl http://localhost:8000/health
# {"status":"ok","engine":"Solana","version":"1.0.0","model":"llama3.2"}

curl http://localhost:4000/api/health
# {"backend":"ok","solana":{"status":"ok",...}}
```

---

## Stopping

```bash
docker compose down          # Stop all services
docker compose down -v       # Stop and remove all data volumes
```
