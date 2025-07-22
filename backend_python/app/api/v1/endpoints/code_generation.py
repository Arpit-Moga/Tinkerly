"""
Code generation API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from dependency_injector.wiring import Provide, inject

from app.models import GenerateCodeRequest, GenerateCodeResponse, ValidateCodeRequest, ValidateCodeResponse
from app.services.abstractions import CodeGenerationService
from app.core import Container
from app.core.exceptions import LLMException, ValidationException
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.post("/", response_model=GenerateCodeResponse)
@inject
async def generate_code(
    request: GenerateCodeRequest,
    code_service: CodeGenerationService = Depends(Provide[Container.code_generation_service])
):
    """Generate code based on user prompt and framework."""
    try:
        logger.info("Code generation request", framework=request.framework.value)
        result = await code_service.generate_code(request)
        return result
    except (LLMException, ValidationException) as e:
        logger.error("Code generation failed", error=str(e))
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error("Unexpected error in code generation", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/validate", response_model=ValidateCodeResponse)
@inject
async def validate_code(
    request: ValidateCodeRequest,
    code_service: CodeGenerationService = Depends(Provide[Container.code_generation_service])
):
    """Validate existing code."""
    try:
        logger.info("Code validation request", framework=request.framework.value)
        result = await code_service.validate_code(request)
        return result
    except (LLMException, ValidationException) as e:
        logger.error("Code validation failed", error=str(e))
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error("Unexpected error in code validation", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")