"""
Pydantic models for structured LLM responses.
"""

from pydantic import BaseModel, Field
from typing import List, Dict


class CodeGenerationOutput(BaseModel):
    """Structured output for code generation."""
    files: Dict[str, str] = Field(..., description="Generated files with filename as key and content as value")
    explanation: str = Field(..., description="Brief explanation of what was created")
    suggestions: List[str] = Field(default_factory=list, description="Suggestions for improvements")


class CodeValidationOutput(BaseModel):
    """Structured output for code validation."""
    is_valid: bool = Field(..., description="Whether the code is valid")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    suggestions: List[str] = Field(default_factory=list, description="Suggestions for improvements")