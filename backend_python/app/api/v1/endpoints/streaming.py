"""
Streaming code generation API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from dependency_injector.wiring import Provide, inject
import json

from app.models import GenerateCodeRequest
from app.services.abstractions import CodeGenerationService
from app.core import Container
from app.core.exceptions import LLMException, ValidationException
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.post("/")
@inject
async def generate_code_stream(
    request: GenerateCodeRequest,
    code_service: CodeGenerationService = Depends(Provide[Container.code_generation_service])
):
    """Generate code with streaming response."""
    
    async def generate():
        try:
            logger.info("Streaming code generation request", framework=request.framework.value)
            
            async for chunk in code_service.generate_code_stream(request):
                # Format as Server-Sent Events
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except (LLMException, ValidationException) as e:
            logger.error("Streaming generation failed", error=str(e))
            yield f"data: {json.dumps({'type': 'error', 'message': e.message})}\n\n"
        except Exception as e:
            logger.error("Unexpected error in streaming generation", error=str(e))
            yield f"data: {json.dumps({'type': 'error', 'message': 'Internal server error'})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )