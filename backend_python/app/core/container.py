"""
Dependency injection container using dependency-injector.
"""

from dependency_injector import containers, providers
from app.config import settings
from app.services.llm import MultiLLMProvider
from app.services.code_generation import CodeGenerationServiceImpl
from app.services.cache import RedisCacheService, MemoryCacheService
from app.services.prompts import PromptService


class Container(containers.DeclarativeContainer):
    """Dependency injection container."""
    
    # Configuration
    config = providers.Object(settings)
    
    # Cache Service (Redis with Memory fallback)
    redis_cache = providers.Singleton(RedisCacheService)
    memory_cache = providers.Singleton(MemoryCacheService, max_size=500)
    
    # Use Redis if available, otherwise Memory cache
    cache_service = providers.Selector(
        "redis_url" in settings.model_dump() and settings.redis_url,
        redis=redis_cache,
        memory=memory_cache
    )
    
    # Prompt Service
    prompt_service = providers.Singleton(PromptService)
    
    # Multi-LLM Provider (supports Gemini, OpenAI, Anthropic, DeepSeek)
    llm_provider = providers.Singleton(
        MultiLLMProvider,
        provider_name=settings.default_llm_provider
    )
    
    # Code Generation Service with all dependencies
    code_generation_service = providers.Singleton(
        CodeGenerationServiceImpl,
        llm_provider=llm_provider,
        cache_service=cache_service,
        prompt_service=prompt_service
    )