"""
FastAPI application entry point.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog

from app.config import settings
from app.core import Container, AppException
from app.api import api_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Dependency injection container
container = Container()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting LLM Code Generator API", version="2.0.0")
    container.wire(modules=[
        "app.api.v1.endpoints.code_generation",
        "app.api.v1.endpoints.streaming",
        "app.api.v1.endpoints.providers",
        "app.api.v1.endpoints.monitoring"
    ])
    yield
    # Shutdown
    logger.info("Shutting down LLM Code Generator API")


# Create FastAPI application
app = FastAPI(
    title="LLM Code Generator API",
    description="Python backend for LLM-powered code generation",
    version="2.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions."""
    logger.error(
        "Application exception",
        exception=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.message,
                "details": exc.details
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(
        "Unhandled exception",
        exception=str(exc),
        path=request.url.path,
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "message": "Internal server error" if not settings.debug else str(exc)
            }
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "success": True,
        "status": "healthy",
        "version": "2.0.0"
    }


# Include API routes
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "LLM Code Generator API",
        "version": "2.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )