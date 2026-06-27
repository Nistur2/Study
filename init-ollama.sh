#!/bin/bash
# Solana — Pull default LLM model into Ollama
# Run this once after `docker compose up`:
#   bash init-ollama.sh

MODEL=${OLLAMA_MODEL:-llama3.2}
OLLAMA_HOST=${OLLAMA_HOST:-http://localhost:11434}

echo "🌟 Solana — Pulling model: $MODEL"
echo "   Ollama host: $OLLAMA_HOST"
echo ""

# Wait for Ollama to be ready
echo "Waiting for Ollama..."
until curl -s "$OLLAMA_HOST/api/tags" > /dev/null 2>&1; do
  sleep 2
done
echo "Ollama is ready."

# Pull the model
docker compose exec ollama ollama pull "$MODEL"

echo ""
echo "✅ Model '$MODEL' is ready."
echo "   Solana is now fully operational."
echo ""
echo "Available models to switch to (update OLLAMA_MODEL in .env):"
echo "  llama3.2        — Meta Llama 3.2 (default, 3B, fast)"
echo "  llama3.1:8b     — Meta Llama 3.1 8B (more capable)"
echo "  qwen2.5:7b      — Alibaba Qwen 2.5 7B (excellent JSON)"
echo "  mistral:7b      — Mistral 7B (fast, efficient)"
echo "  gemma2:9b       — Google Gemma 2 9B"
echo "  phi3:mini       — Microsoft Phi-3 Mini (lightweight)"
