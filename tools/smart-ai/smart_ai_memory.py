"""SMART AI-only long-term memory with explicit storage policy."""
import chromadb
from pathlib import Path
from datetime import datetime, timezone
import uuid

PERSIST_DIR = str(Path(__file__).resolve().parents[2] / "data" / "chroma")
FORBIDDEN = ("password", "token", "secret", "api_key", "credit card", "cvv")

class SmartAiMemory:
    def __init__(self, persist_dir=PERSIST_DIR):
        Path(persist_dir).mkdir(parents=True, exist_ok=True); self.client = chromadb.PersistentClient(path=persist_dir)
    def _col(self, user_id: str): return self.client.get_or_create_collection(name=f"smart_ai_user_{user_id}")
    def _allowed(self, text: str) -> bool: return not any(x in text.lower() for x in FORBIDDEN)
    def remember(self, user_id: str, text: str, type="general", expires_at=None, explicit=True):
        if not explicit: return {"error": "SMART AI: memory requires explicit save permission"}
        if not text.strip() or not self._allowed(text): return {"error": "SMART AI: forbidden or empty memory"}
        doc_id = str(uuid.uuid4()); meta = {"type": type, "tool": "SMART_AI", "saved_at": datetime.now(timezone.utc).isoformat()}
        if expires_at: meta["expires_at"] = expires_at
        self._col(user_id).add(documents=[text], metadatas=[meta], ids=[doc_id]); return doc_id
    def recall(self, user_id: str, query: str, n=5, filter_type=None):
        where = {"type": filter_type} if filter_type else None; res = self._col(user_id).query(query_texts=[query], n_results=max(1,n), where=where)
        return [{"id": i, "text": d, "metadata": m} for i,d,m in zip(res.get("ids",[[]])[0], res.get("documents",[[]])[0], res.get("metadatas",[[]])[0])]
    def forget(self, user_id: str, doc_id: str): self._col(user_id).delete(ids=[doc_id]); return True
