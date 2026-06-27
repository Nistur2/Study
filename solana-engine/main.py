"""
Solana AI Engine — Core intelligence of the StudyAI platform.
Handles document ingestion, RAG retrieval, and AI generation.
"""

import os
import hashlib
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from document_processor import extract_text
from rag import SolanaRAG
from generator import SolanaGenerator

app = FastAPI(title="Solana AI Engine", version="1.0.0", description="Self-hosted AI by Solana")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialize Solana components ──────────────────────────────────────────────
rag = SolanaRAG()
gen = SolanaGenerator()


# ── Request models ────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    mode: str
    file_data: str
    file_mime: str
    file_name: str
    difficulty: str = "medium"
    language: str = "English"


class ChatRequest(BaseModel):
    file_data: str
    file_mime: str
    file_name: str
    messages: List[dict]
    language: str = "English"


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": "Solana",
        "version": "1.0.0",
        "model": os.getenv("OLLAMA_MODEL", "llama3.2"),
    }


@app.post("/generate")
async def generate(req: GenerateRequest):
    try:
        text = await extract_text(req.file_data, req.file_mime, req.file_name)
        doc_id = hashlib.md5(req.file_data[:200].encode()).hexdigest()
        chunks = rag.ingest_and_retrieve(text, req.mode, doc_id)
        result = await gen.generate(
            mode=req.mode,
            chunks=chunks,
            difficulty=req.difficulty,
            language=req.language,
        )
        return {"content": [{"type": "text", "text": result}]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        text = await extract_text(req.file_data, req.file_mime, req.file_name)
        doc_id = hashlib.md5(req.file_data[:200].encode()).hexdigest()
        last_user = next(
            (m["content"] for m in reversed(req.messages) if m["role"] == "user"), ""
        )
        chunks = rag.retrieve(text, last_user, doc_id)
        reply = await gen.chat(chunks=chunks, messages=req.messages, language=req.language)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
