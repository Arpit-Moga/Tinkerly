"""
Abstract base class for code generation services.
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator
from app.models import GenerateCodeRequest, GenerateCodeResponse, ValidateCodeRequest, ValidateCodeResponse


class CodeGenerationService(ABC):
    """Abstract base class for code generation services."""
    
    @abstractmethod
    async def generate_code(self, request: GenerateCodeRequest) -> GenerateCodeResponse:
        """
        Generate code based on user requirements.
        
        Args:
            request: Code generation request parameters
            
        Returns:
            Generated code response with files and explanation
        """
        pass
    
    @abstractmethod
    async def generate_code_stream(
        self, 
        request: GenerateCodeRequest
    ) -> AsyncGenerator[str, None]:
        """
        Generate code with streaming support.
        
        Args:
            request: Code generation request parameters
            
        Yields:
            Streaming chunks of the generation process
        """
        pass
    
    @abstractmethod
    async def validate_code(self, request: ValidateCodeRequest) -> ValidateCodeResponse:
        """
        Validate existing code.
        
        Args:
            request: Code validation request parameters
            
        Returns:
            Validation results with errors and suggestions
        """
        pass