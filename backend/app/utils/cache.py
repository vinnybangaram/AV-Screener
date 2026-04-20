import time
from typing import Any, Dict, Optional

class SimpleTTLCache:
    """A simple in-memory cache with TTL support."""
    def __init__(self, default_ttl: int = 300):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            item = self.cache[key]
            if time.time() < item['expiry']:
                return item['value']
            else:
                del self.cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        ttl = ttl if ttl is not None else self.default_ttl
        self.cache[key] = {
            'value': value,
            'expiry': time.time() + ttl
        }

    def clear(self):
        self.cache.clear()

# Global cache instances
analysis_cache = SimpleTTLCache(default_ttl=300) # 5 mins
market_cache = SimpleTTLCache(default_ttl=60)   # 1 min
ai_cache = SimpleTTLCache(default_ttl=3600)     # 1 hour
