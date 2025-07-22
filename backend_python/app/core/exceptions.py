"""
Custom exceptions for the application.
"""

from typing import Optional, Dict, Any


class AppException(Exception):
    """Base application exception."""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(AppException):
    """Exception for validation errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)


class LLMException(AppException):
    """Exception for LLM-related errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=502, details=details)