"""
Redis-based cache service implementation.
"""

import json
import asyncio
from typing import Optional, Any
from app.services.cache.cache_service import CacheService
from app.config import settings
import structlog

logger = structlog.get_logger()

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None


class RedisCacheService(CacheService):
    """Redis-based cache service."""
    
    def __init__(self):
        self.redis_client = None
        self._connection_pool = None
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection."""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available, cache will be disabled")
            return
        
        try:
            # Create connection pool
            self._connection_pool = redis.ConnectionPool.from_url(
                settings.redis_url,
                max_connections=20,
                retry_on_timeout=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            
            self.redis_client = redis.Redis(
                connection_pool=self._connection_pool,
                decode_responses=True
            )
            
            logger.info("Redis cache initialized", url=settings.redis_url)
            
        except Exception as e:
            logger.error("Failed to initialize Redis cache", error=str(e))
            self.redis_client = None
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache."""
        if not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            if value is None:
                return None
            
            # Try to deserialize JSON
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
                
        except Exception as e:
            logger.warning("Cache get failed", key=key, error=str(e))
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set value in Redis cache with TTL."""
        if not self.redis_client:
            return
        
        try:
            # Serialize value to JSON if it's not a string
            if isinstance(value, (dict, list, tuple)):
                serialized_value = json.dumps(value)
            else:
                serialized_value = str(value)
            
            await self.redis_client.setex(key, ttl, serialized_value)
            logger.debug("Cache set", key=key, ttl=ttl)
            
        except Exception as e:
            logger.warning("Cache set failed", key=key, error=str(e))
    
    async def delete(self, key: str) -> None:
        """Delete value from Redis cache."""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.delete(key)
            logger.debug("Cache delete", key=key)
            
        except Exception as e:
            logger.warning("Cache delete failed", key=key, error=str(e))
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis cache."""
        if not self.redis_client:
            return False
        
        try:
            result = await self.redis_client.exists(key)
            return bool(result)
            
        except Exception as e:
            logger.warning("Cache exists check failed", key=key, error=str(e))
            return False
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.flushdb()
            logger.info("Cache cleared")
            
        except Exception as e:
            logger.error("Cache clear failed", error=str(e))
    
    async def close(self):
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()
        if self._connection_pool:
            await self._connection_pool.disconnect()
        logger.info("Redis cache connection closed")
    
    async def health_check(self) -> bool:
        """Check Redis connection health."""
        if not self.redis_client:
            return False
        
        try:
            await self.redis_client.ping()
            return True
        except Exception:
            return False