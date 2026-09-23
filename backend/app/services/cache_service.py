import time
from typing import Any, Optional, Dict

class SimpleTTLCache:
    def __init__(self, default_ttl: int = 600):
        self.default_ttl = default_ttl
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        item = self._cache[key]
        if time.time() > item["expires_at"]:
            del self._cache[key]
            return None
        return item["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expiry = time.time() + (ttl if ttl is not None else self.default_ttl)
        self._cache[key] = {
            "value": value,
            "expires_at": expiry,
            "created_at": time.time()
        }

    def clear(self) -> None:
        self._cache.clear()

    def get_info(self) -> Dict[str, Any]:
        valid_keys = [k for k, v in self._cache.items() if time.time() <= v["expires_at"]]
        return {
            "total_items": len(valid_keys),
            "keys": valid_keys
        }

# Global cache instance
cache = SimpleTTLCache(default_ttl=600)
