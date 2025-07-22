"""
Configuration settings using Pydantic for type safety and validation.
"""

from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Server Configuration
    host: str = Field(default="localhost", env="HOST")
    port: int = Field(default=3001, env="PORT")
    debug: bool = Field(default=False, env="DEBUG")
    
    # LLM Configuration
    gemini_api_key: str = Field(default="", env="GEMINI_API_KEY")
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    anthropic_api_key: str = Field(default="", env="ANTHROPIC_API_KEY")
    deepseek_api_key: str = Field(default="", env="DEEPSEEK_API_KEY")
    
    # Default LLM provider
    default_llm_provider: str = Field(default="gemini", env="DEFAULT_LLM_PROVIDER")
    
    # Cache Configuration
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"], 
        env="CORS_ORIGINS"
    )
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()