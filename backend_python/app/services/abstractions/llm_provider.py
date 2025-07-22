"""
Abstract base class for LLM providers.
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, Dict, Any


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    async def generate_content(
        self, 
        prompt: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate content using the LLM.
        
        Args:
            prompt: The input prompt for generation
            config: Provider-specific configuration
            
        Returns:
            Generated content as string
        """
        pass
    
    @abstractmethod
    async def generate_content_stream(
        self, 
        prompt: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate content with streaming support.
        
        Args:
            prompt: The input prompt for generation
            config: Provider-specific configuration
            
        Yields:
            Chunks of generated content
        """
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """
        Check if the provider is available and configured.
        
        Returns:
            True if provider is available, False otherwise
        """
        pass