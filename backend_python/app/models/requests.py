"""
Request models for API endpoints.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from .domain import Framework, ConversationMessage


class GenerateCodeRequest(BaseModel):
    """Request model for code generation."""
    prompt: str = Field(..., min_length=1, description="Code generation prompt")
    framework: Framework = Field(..., description="Target framework")
    conversation_history: List[ConversationMessage] = Field(
        default_factory=list, 
        description="Previous conversation messages"
    )
    current_files: Dict[str, str] = Field(
        default_factory=dict,
        description="Current files in the project"
    )
    
    @validator('prompt')
    def validate_prompt(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Prompt cannot be empty')
        return v.strip()


class ValidateCodeRequest(BaseModel):
    """Request model for code validation."""
    files: Dict[str, str] = Field(..., description="Files to validate")
    framework: Framework = Field(..., description="Framework being used")