from __future__ import annotations
import os
from typing import Any


def get_collection(user_id: str = "default"):
    import chromadb
    client = chromadb.PersistentClient(path=os.getenv("OPEN_MIND_CHROMA_PATH", "./data/chroma"))
    return client.get_or_create_collection(name=f"user_{user_id}", metadata={"hnsw:space": "cosine"})


def remember(user_id: str, memory_id: str, text: str, metadata: dict[str, Any] | None = None) -> None:
    if not text.strip(): raise ValueError("memory text cannot be empty")
    get_collection(user_id).upsert(ids=[memory_id], documents=[text], metadatas=[metadata or {}])


def recall(user_id: str, query: str, n: int = 5) -> list[dict[str, Any]]:
    if not query.strip(): return []
    result = get_collection(user_id).query(query_texts=[query], n_results=max(1, min(n, 20)))
    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]
    ids = result.get("ids", [[]])[0]
    return [{"id": i, "text": d, "metadata": m} for i, d, m in zip(ids, docs, metas)]


def forget(user_id: str, memory_ids: list[str]) -> None:
    get_collection(user_id).delete(ids=memory_ids)
