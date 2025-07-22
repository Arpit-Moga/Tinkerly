"""
LLM provider management endpoints.
"""

from fastapi import APIRouter, Depends
from dependency_injector.wiring import Provide, inject
from typing import List

from app.services.llm import MultiLLMProvider
from app.core import Container
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.get("/available", response_model=List[str])
@inject
async def get_available_providers(
    llm_provider: MultiLLMProvider = Depends(Provide[Container.llm_provider])
):
    """Get list of available LLM providers based on configured API keys."""
    try:
        available_providers = llm_provider.get_available_providers()
        logger.info("Available providers retrieved", providers=available_providers)
        return available_providers
    except Exception as e:
        logger.error("Failed to get available providers", error=str(e))
        return []


@router.get("/current")
@inject
async def get_current_provider(
    llm_provider: MultiLLMProvider = Depends(Provide[Container.llm_provider])
):
    """Get the currently active LLM provider."""
    return {
        "provider": llm_provider.provider_name,
        "available": await llm_provider.is_available()
    }