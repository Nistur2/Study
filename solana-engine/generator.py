"""
Solana Generator
Calls Ollama with RAG-retrieved context and structured system prompts.
Every response includes source references for transparency.
"""

import os
from typing import List
import httpx

OLLAMA_HOST  = os.getenv("OLLAMA_HOST", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

# ── Solana system prompts per mode ────────────────────────────────────────────
PROMPTS = {
    "quiz": """\
You are Solana, the AI engine of StudyAI. Generate a quiz from the document excerpts below.
Return ONLY valid JSON — no markdown fences, no extra text:
{
  "title": "string",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": ["A. text", "B. text", "C. text", "D. text"],
      "answer": "A",
      "explanation": "string",
      "source": "Page X or section name"
    }
  ]
}
Generate exactly 5 questions. Each must cite its source section.""",

    "notes": """\
You are Solana, the AI engine of StudyAI. Generate structured study notes from the excerpts.
Return ONLY valid JSON — no markdown fences, no extra text:
{
  "title": "string",
  "summary": "2-3 sentence overview",
  "sections": [
    {
      "heading": "string",
      "content": "string",
      "keyPoints": ["string"],
      "source": "Page X or section name"
    }
  ],
  "keyTerms": [{"term": "string", "definition": "string"}]
}
Generate 3-4 sections with source references. Include 4-5 key terms.""",

    "flash": """\
You are Solana, the AI engine of StudyAI. Generate flashcards from the excerpts.
Return ONLY valid JSON — no markdown fences, no extra text:
{
  "title": "string",
  "cards": [
    {
      "id": 1,
      "front": "term or concept",
      "back": "definition or explanation",
      "source": "Page X or section name"
    }
  ]
}
Generate exactly 10 flashcards with source references.""",

    "summary": """\
You are Solana, the AI engine of StudyAI. Generate a TL;DR summary from the excerpts.
Return ONLY valid JSON — no markdown fences, no extra text:
{
  "title": "string",
  "bullets": [
    {"emoji": "string", "text": "one impactful sentence", "source": "Page X or section"}
  ],
  "keyTakeaway": "string"
}
Generate exactly 5 bullets with source references.""",

    "blank": """\
You are Solana, the AI engine of StudyAI. Generate fill-in-the-blank exercises from the excerpts.
Return ONLY valid JSON — no markdown fences, no extra text:
{
  "title": "string",
  "sentences": [
    {
      "id": 1,
      "before": "text before blank",
      "answer": "missing word",
      "after": "text after blank",
      "source": "Page X or section name"
    }
  ]
}
Generate exactly 6 sentences with source references.""",
}


class SolanaGenerator:
    async def generate(
        self,
        mode: str,
        chunks: List[str],
        difficulty: str = "medium",
        language: str = "English",
    ) -> str:
        context  = "\n\n---\n\n".join(chunks)
        sys_p    = PROMPTS.get(mode, PROMPTS["notes"])
        lang_n   = f"Respond in {language}. " if language != "English" else ""
        diff_n   = {
            "easy": "Use simple language and basic recall questions.",
            "hard": "Focus on deep analysis and synthesis.",
        }.get(difficulty, "Mix recall and application questions.")

        user_msg = f"{lang_n}{diff_n}\n\nDocument excerpts:\n{context}"
        return await self._ollama([
            {"role": "system", "content": sys_p},
            {"role": "user",   "content": user_msg},
        ])

    async def chat(
        self,
        chunks: List[str],
        messages: List[dict],
        language: str = "English",
    ) -> str:
        context = "\n\n---\n\n".join(chunks)
        lang_n  = f"Always respond in {language}. " if language != "English" else ""
        sys_p   = f"""\
You are Solana, the AI tutor of StudyAI. {lang_n}
You have access to these document excerpts:
---
{context}
---
Answer questions based on the material. Be clear, concise, and encouraging.
Always mention which part of the document your answer comes from."""

        return await self._ollama([
            {"role": "system", "content": sys_p},
            *messages,
        ])

    async def _ollama(self, messages: List[dict]) -> str:
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model":    OLLAMA_MODEL,
                    "messages": messages,
                    "stream":   False,
                    "options":  {
                        "temperature": 0.3,
                        "num_predict": 2000,
                        "top_p":       0.9,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "")
