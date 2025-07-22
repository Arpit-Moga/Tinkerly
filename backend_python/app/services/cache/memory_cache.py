"""
In-memory cache service implementation with TTL support.
"""

import asyncio
import time
from typing import Optional, Any, Dict, Tuple
from app.services.cache.cache_service import CacheService
import structlog

logger = structlog.get_logger()


class MemoryCacheService(CacheService):
    """In-memory cache service with TTL support."""
    
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._cache: Dict[str, Tuple[Any, float]] = {}  # key -> (value, expiry_time)
        self._access_times: Dict[str, float] = {}  # key -> last_access_time
        self._lock = asyncio.Lock()
        
        # Start cleanup task
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
        
        logger.info("Memory cache initialized", max_size=max_size)
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from memory cache."""
        async with self._lock:
            if key not in self._cache:
                return None
            
            value, expiry_time = self._cache[key]
            current_time = time.time()
            
            # Check if expired
            if current_time > expiry_time:
                del self._cache[key]
                if key in self._access_times:
                    del self._access_times[key]
                return None
            
            # Update access time for LRU
            self._access_times[key] = current_time
            return value
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set value in memory cache with TTL."""
        async with self._lock:
            current_time = time.time()
            expiry_time = current_time + ttl
            
            # Check if we need to evict items
            if len(self._cache) >= self.max_size and key not in self._cache:
                await self._evict_lru()
            
            self._cache[key] = (value, expiry_time)
            self._access_times[key] = current_time
            
            logger.debug("Memory cache set", key=key, ttl=ttl)
    
    async def delete(self, key: str) -> None:
        """Delete value from memory cache."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
            if key in self._access_times:
                del self._access_times[key]
            
            logger.debug("Memory cache delete", key=key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in memory cache."""
        async with self._lock:
            if key not in self._cache:
                return False
            
            _, expiry_time = self._cache[key]
            current_time = time.time()
            
            # Check if expired
            if current_time > expiry_time:
                del self._cache[key]
                if key in self._access_times:
                    del self._access_times[key]
                return False
            
            return True
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        async with self._lock:
            self._cache.clear()
            self._access_times.clear()
            
            logger.info("Memory cache cleared")
    
    async def _evict_lru(self) -> None:
        """Evict least recently used item."""
        if not self._access_times:
            return
        
        # Find the least recently used key
        lru_key = min(self._access_times.keys(), key=lambda k: self._access_times[k])
        
        # Remove from both caches
        if lru_key in self._cache:
            del self._cache[lru_key]
        del self._access_times[lru_key]
        
        logger.debug("Memory cache LRU eviction", evicted_key=lru_key)
    
    async def _periodic_cleanup(self) -> None:
        """Periodically clean up expired entries."""
        while True:
            try:
                await asyncio.sleep(300)  # Clean up every 5 minutes
                await self._cleanup_expired()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Memory cache cleanup error", error=str(e))
    
    async def _cleanup_expired(self) -> None:
        """Clean up expired entries."""
        async with self._lock:
            current_time = time.time()
            expired_keys = []
            
            for key, (_, expiry_time) in self._cache.items():
                if current_time > expiry_time:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._cache[key]
                if key in self._access_times:
                    del self._access_times[key]
            
            if expired_keys:
                logger.debug("Memory cache cleanup", expired_count=len(expired_keys))
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "hit_ratio": self._calculate_hit_ratio()
        }
    
    def _calculate_hit_ratio(self) -> float:
        """Calculate cache hit ratio (placeholder for now)."""
        # This would require tracking hits/misses
        return 0.0
    
    async def close(self):
        """Close memory cache and cleanup."""
        if hasattr(self, '_cleanup_task'):
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        await self.clear()
        logger.info("Memory cache closed")