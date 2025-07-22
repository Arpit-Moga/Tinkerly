"""
Gemini LLM Provider implementation using LangChain.
"""

import asyncio
from typing import AsyncGenerator, Optional, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langchain_core.callbacks import AsyncCallbackHandler

from app.services.abstractions import LLMProvider
from app.core.exceptions import LLMException
from app.config import settings
import structlog

logger = structlog.get_logger()


class StreamingCallbackHandler(AsyncCallbackHandler):
    """Callback handler for streaming responses."""
    
    def __init__(self):
        self.tokens = []
        
    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Handle new token from LLM."""
        self.tokens.append(token)


class GeminiProvider(LLMProvider):
    """Gemini LLM provider implementation using LangChain."""
    
    def __init__(self):
        """Initialize the Gemini provider."""
        self.llm = None
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize the LangChain Gemini LLM."""
        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=settings.gemini_api_key,
                temperature=0.1,
                max_tokens=8192,
                timeout=60,
                max_retries=2,
            )
            logger.info("Gemini LLM initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize Gemini LLM", error=str(e))
            raise LLMException(f"Failed to initialize Gemini: {str(e)}")
    
    async def generate_content(
        self, 
        prompt: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate content using Gemini.
        
        Args:
            prompt: The input prompt
            config: Optional configuration overrides
            
        Returns:
            Generated content as string
        """
        try:
            if not self.llm:
                raise LLMException("Gemini LLM not initialized")
            
            # Create message
            message = HumanMessage(content=prompt)
            
            # Apply config overrides if provided
            llm_to_use = self.llm
            if config:
                llm_to_use = self.llm.bind(**config)
            
            # Generate response
            response = await llm_to_use.ainvoke([message])
            
            logger.info("Content generated successfully", prompt_length=len(prompt))
            return response.content
            
        except Exception as e:
            logger.error("Content generation failed", error=str(e))
            raise LLMException(f"Content generation failed: {str(e)}")
    
    async def generate_content_stream(
        self, 
        prompt: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate content with streaming.
        
        Args:
            prompt: The input prompt
            config: Optional configuration overrides
            
        Yields:
            Chunks of generated content
        """
        try:
            if not self.llm:
                raise LLMException("Gemini LLM not initialized")
            
            # Create message
            message = HumanMessage(content=prompt)
            
            # Apply config overrides if provided
            llm_to_use = self.llm
            if config:
                llm_to_use = self.llm.bind(**config)
            
            # Stream response
            async for chunk in llm_to_use.astream([message]):
                if chunk.content:
                    yield chunk.content
                    
        except Exception as e:
            logger.error("Streaming generation failed", error=str(e))
            raise LLMException(f"Streaming generation failed: {str(e)}")
    
    async def is_available(self) -> bool:
        """
        Check if Gemini is available.
        
        Returns:
            True if available, False otherwise
        """
        try:
            if not self.llm or not settings.gemini_api_key:
                return False
            
            # Test with a simple prompt
            test_message = HumanMessage(content="Hello")
            response = await self.llm.ainvoke([test_message])
            return bool(response.content)
            
        except Exception as e:
            logger.warning("Gemini availability check failed", error=str(e))
            return False