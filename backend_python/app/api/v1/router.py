"""
API v1 router configuration.
"""

from fastapi import APIRouter
from .endpoints import code_generation, streaming, providers, monitoring

api_router = APIRouter(prefix="/api/v1")

# Include endpoint routers
api_router.include_router(
    code_generation.router,
    prefix="/generate",
    tags=["code-generation"]
)

api_router.include_router(
    streaming.router,
    prefix="/stream",
    tags=["streaming"]
)

api_router.include_router(
    providers.router,
    prefix="/providers",
    tags=["providers"]
)

api_router.include_router(
    monitoring.router,
    prefix="/monitoring",
    tags=["monitoring"]
)