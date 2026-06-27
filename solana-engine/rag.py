"""
Solana RAG Pipeline
Chunks documents, generates local embeddings, stores in ChromaDB,
and retrieves the most relevant sections for generation.
"""

import os
from typing import List
import chromadb
from sentence_transformers import SentenceTransformer


class SolanaRAG:
    def __init__(self):
        host = os.getenv("CHROMADB_HOST", "chromadb")
        port = int(os.getenv("CHROMADB_PORT", "8080"))

        try:
            self.client = chromadb.HttpClient(host=host, port=port)
        except Exception:
            # Fallback to in-memory if ChromaDB is not yet ready
            self.client = chromadb.Client()

        # Local embedding model — no external API needed
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
        self.chunk_size = 400   # words per chunk
        self.overlap    = 50    # word overlap between chunks

    # ── Text chunking ─────────────────────────────────────────────────────────
    def _chunk(self, text: str) -> List[str]:
        words  = text.split()
        chunks = []
        step   = self.chunk_size - self.overlap
        for i in range(0, len(words), step):
            chunk = " ".join(words[i : i + self.chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        return chunks

    # ── Collection management ─────────────────────────────────────────────────
    def _collection(self, doc_id: str):
        name = f"solana_{doc_id[:24]}"
        try:
            return self.client.get_collection(name)
        except Exception:
            return self.client.create_collection(
                name,
                metadata={"hnsw:space": "cosine"},
            )

    # ── Ingest & retrieve ─────────────────────────────────────────────────────
    def ingest_and_retrieve(
        self, text: str, query: str, doc_id: str, n: int = 6
    ) -> List[str]:
        col = self._collection(doc_id)

        # Only embed and store if collection is empty
        if col.count() == 0:
            chunks = self._chunk(text)
            if not chunks:
                return [text[:4000]]

            embeddings = self.embedder.encode(chunks, show_progress_bar=False).tolist()
            col.add(
                embeddings=embeddings,
                documents=chunks,
                ids=[f"c{i}" for i in range(len(chunks))],
            )

        return self.retrieve(text, query, doc_id, n)

    def retrieve(self, text: str, query: str, doc_id: str, n: int = 6) -> List[str]:
        col = self._collection(doc_id)

        if col.count() == 0:
            return [text[:4000]]

        q_emb   = self.embedder.encode([query], show_progress_bar=False).tolist()
        results = col.query(
            query_embeddings=q_emb,
            n_results=min(n, col.count()),
        )
        docs = results.get("documents", [[]])[0]
        return docs if docs else [text[:4000]]
