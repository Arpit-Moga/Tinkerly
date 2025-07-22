"""
Abstract cache service interface.
"""

from abc import ABC, abstractmethod
from typing import Optional, Any, List
import hashlib
import json


class CacheService(ABC):
    """Abstract cache service interface."""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        pass
    
    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set value in cache with TTL."""
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        pass
    
    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        pass
    
    @abstractmethod
    async def clear(self) -> None:
        """Clear all cache entries."""
        pass
    
    def generate_cache_key(self, prefix: str, **kwargs) -> str:
        """Generate a consistent cache key from parameters."""
        # Sort kwargs for consistent key generation
        sorted_kwargs = sorted(kwargs.items())
        key_data = f"{prefix}:{json.dumps(sorted_kwargs, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def generate_prompt_cache_key(self, prompt: str, framework: str, **kwargs) -> str:
        """Generate cache key for prompt-based requests."""
        return self.generate_cache_key(
            "prompt",
            prompt=prompt[:100],  # Truncate long prompts
            framework=framework,
            **kwargs
        )
    
    def generate_validation_cache_key(self, files: dict, framework: str) -> str:
        """Generate cache key for validation requests."""
        # Create hash of file contents
        files_hash = hashlib.md5(
            json.dumps(files, sort_keys=True).encode()
        ).hexdigest()
        
        return self.generate_cache_key(
            "validation",
            files_hash=files_hash,
            framework=framework
        )