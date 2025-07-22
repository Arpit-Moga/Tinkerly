"""
Monitoring and performance endpoints.
"""

from fastapi import APIRouter, Depends
from dependency_injector.wiring import Provide, inject
from typing import Dict, Any

from app.services.cache.cache_service import CacheService
from app.services.llm import MultiLLMProvider
from app.core import Container
import structlog
import time
import psutil
import os

logger = structlog.get_logger()
router = APIRouter()


@router.get("/health")
async def health_check():
    """Comprehensive health check."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "2.0.0",
        "environment": os.getenv("NODE_ENV", "development")
    }


@router.get("/health/detailed")
@inject
async def detailed_health_check(
    cache_service: CacheService = Depends(Provide[Container.cache_service]),
    llm_provider: MultiLLMProvider = Depends(Provide[Container.llm_provider])
):
    """Detailed health check with service status."""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {}
    }
    
    # Check cache service
    try:
        if hasattr(cache_service, 'health_check'):
            cache_healthy = await cache_service.health_check()
        else:
            cache_healthy = True
        health_status["services"]["cache"] = {
            "status": "healthy" if cache_healthy else "unhealthy",
            "type": cache_service.__class__.__name__
        }
    except Exception as e:
        health_status["services"]["cache"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Check LLM provider
    try:
        llm_healthy = await llm_provider.is_available()
        health_status["services"]["llm"] = {
            "status": "healthy" if llm_healthy else "unhealthy",
            "provider": llm_provider.provider_name,
            "available_providers": llm_provider.get_available_providers()
        }
    except Exception as e:
        health_status["services"]["llm"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Overall status
    all_healthy = all(
        service.get("status") == "healthy" 
        for service in health_status["services"].values()
    )
    health_status["status"] = "healthy" if all_healthy else "degraded"
    
    return health_status


@router.get("/metrics")
@inject
async def get_metrics(
    cache_service: CacheService = Depends(Provide[Container.cache_service])
):
    """Get application metrics."""
    metrics = {
        "timestamp": time.time(),
        "system": _get_system_metrics(),
        "cache": _get_cache_metrics(cache_service)
    }
    
    return metrics


@router.get("/performance")
async def get_performance_stats():
    """Get performance statistics."""
    process = psutil.Process()
    
    return {
        "timestamp": time.time(),
        "cpu_percent": process.cpu_percent(),
        "memory_info": {
            "rss": process.memory_info().rss,
            "vms": process.memory_info().vms,
            "percent": process.memory_percent()
        },
        "open_files": len(process.open_files()),
        "connections": len(process.connections()),
        "threads": process.num_threads()
    }


def _get_system_metrics() -> Dict[str, Any]:
    """Get system-level metrics."""
    try:
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent
            }
        }
    except Exception as e:
        logger.error("Failed to get system metrics", error=str(e))
        return {"error": str(e)}


def _get_cache_metrics(cache_service: CacheService) -> Dict[str, Any]:
    """Get cache-specific metrics."""
    try:
        if hasattr(cache_service, 'get_stats'):
            return cache_service.get_stats()
        else:
            return {
                "type": cache_service.__class__.__name__,
                "status": "available"
            }
    except Exception as e:
        logger.error("Failed to get cache metrics", error=str(e))
        return {"error": str(e)}