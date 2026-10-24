"""
Session State Cache and In-Memory Feature Vector Cache.
Stores pre-computed embeddings and recent session states to optimize inference speed.
"""
from typing import Dict, Any, Optional
import time

class SimpleMemoryCache:
    def __init__(self, ttl_seconds: int = 3600):
        self._cache: Dict[str, Any] = {}
        self._timestamps: Dict[str, float] = {}
        self.ttl = ttl_seconds

    def set(self, key: str, value: Any) -> None:
        self._cache[key] = value
        self._timestamps[key] = time.time()

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            if time.time() - self._timestamps[key] < self.ttl:
                return self._cache[key]
            else:
                del self._cache[key]
                del self._timestamps[key]
        return None

    def clear(self) -> None:
        self._cache.clear()
        self._timestamps.clear()

# Global cache instances
session_cache = SimpleMemoryCache(ttl_seconds=86400)
vector_cache = SimpleMemoryCache(ttl_seconds=86400 * 7)

