"""
Response models for API endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Dict
from .domain import Framework


class GenerateCodeResponse(BaseModel):
    """Response model for code generation."""
    files: Dict[str, str] = Field(..., description="Generated files")
    explanation: str = Field(..., description="Explanation of the generated code")
    suggestions: List[str] = Field(
        default_factory=list, 
        description="Suggestions for improvements"
    )
    framework_used: Framework = Field(..., description="Framework that was used")


class ValidateCodeResponse(BaseModel):
    """Response model for code validation."""
    is_valid: bool = Field(..., description="Whether the code is valid")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    suggestions: List[str] = Field(
        default_factory=list, 
        description="Suggestions for improvements"
    )