"""
Code generation service implementation.
"""

import json
from typing import AsyncGenerator, Dict, Any
from app.services.abstractions import CodeGenerationService, LLMProvider
from app.services.cache.cache_service import CacheService
from app.services.prompts.prompt_service import PromptService
from app.models import (
    GenerateCodeRequest, GenerateCodeResponse, 
    ValidateCodeRequest, ValidateCodeResponse,
    CodeGenerationOutput, CodeValidationOutput
)
from app.core.exceptions import LLMException, ValidationException
import structlog

logger = structlog.get_logger()


class CodeGenerationServiceImpl(CodeGenerationService):
    """Implementation of code generation service with caching and advanced prompts."""
    
    def __init__(
        self, 
        llm_provider: LLMProvider,
        cache_service: CacheService,
        prompt_service: PromptService
    ):
        """Initialize with LLM provider, cache, and prompt service."""
        self.llm_provider = llm_provider
        self.cache_service = cache_service
        self.prompt_service = prompt_service
    
    def _build_generation_prompt(self, request: GenerateCodeRequest) -> str:
        """Build the prompt for code generation."""
        framework_instructions = {
            "react": "Create a React application with TypeScript, using modern hooks and best practices.",
            "vue": "Create a Vue.js application with TypeScript and Composition API.",
            "svelte": "Create a Svelte application with TypeScript.",
            "angular": "Create an Angular application with TypeScript and modern practices.",
            "nodejs": "Create a Node.js application with TypeScript and Express."
        }
        
        base_instruction = framework_instructions.get(
            request.framework.value, 
            f"Create a {request.framework.value} application"
        )
        
        conversation_context = ""
        if request.conversation_history:
            conversation_context = "\n\nPrevious conversation:\n"
            for msg in request.conversation_history[-5:]:  # Last 5 messages
                conversation_context += f"{msg.role}: {msg.content}\n"
        
        current_files_context = ""
        if request.current_files:
            current_files_context = "\n\nCurrent project files:\n"
            for filename, content in request.current_files.items():
                current_files_context += f"\n--- {filename} ---\n{content[:500]}...\n"
        
        prompt = f"""
{base_instruction}

User Request: {request.prompt}

{conversation_context}
{current_files_context}

Requirements:
1. Generate complete, production-ready code
2. Include proper error handling and validation
3. Use TypeScript for type safety
4. Follow best practices and modern patterns
5. Include necessary dependencies in package.json if needed
6. Provide clear file structure

Please respond with a JSON object containing:
{{
    "files": {{
        "filename1": "file_content1",
        "filename2": "file_content2"
    }},
    "explanation": "Brief explanation of what was created",
    "suggestions": ["suggestion1", "suggestion2"]
}}

Ensure the JSON is valid and properly formatted.
"""
        return prompt
    
    def _build_validation_prompt(self, request: ValidateCodeRequest) -> str:
        """Build the prompt for code validation."""
        files_content = ""
        for filename, content in request.files.items():
            files_content += f"\n--- {filename} ---\n{content}\n"
        
        prompt = f"""
Please validate the following {request.framework.value} code for:
1. Syntax errors
2. Type errors (if TypeScript)
3. Best practices
4. Security issues
5. Performance concerns

Files to validate:
{files_content}

Please respond with a JSON object containing:
{{
    "is_valid": true/false,
    "errors": ["error1", "error2"],
    "warnings": ["warning1", "warning2"],
    "suggestions": ["suggestion1", "suggestion2"]
}}

Ensure the JSON is valid and properly formatted.
"""
        return prompt
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON response from LLM."""
        try:
            # Try to find JSON in the response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON found in response")
            
            json_str = response[start_idx:end_idx]
            return json.loads(json_str)
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("Failed to parse JSON response", error=str(e), response=response[:200])
            raise ValidationException(f"Invalid response format: {str(e)}")
    
    async def generate_code(self, request: GenerateCodeRequest) -> GenerateCodeResponse:
        """Generate code based on the request with caching."""
        try:
            logger.info("Starting code generation", framework=request.framework.value)
            
            # Check cache first
            cache_key = self.cache_service.generate_prompt_cache_key(
                prompt=request.prompt,
                framework=request.framework.value,
                conversation_history=len(request.conversation_history),
                current_files=len(request.current_files)
            )
            
            cached_result = await self.cache_service.get(cache_key)
            if cached_result:
                logger.info("Cache hit for code generation", cache_key=cache_key)
                return GenerateCodeResponse(**cached_result)
            
            # Build advanced prompt using prompt service
            prompt = self.prompt_service.build_generation_prompt(request)
            
            # Check if provider supports structured output
            if hasattr(self.llm_provider, 'generate_structured_content'):
                # Use structured output with Pydantic validation
                structured_response = await self.llm_provider.generate_structured_content(
                    prompt, CodeGenerationOutput
                )
                
                result = GenerateCodeResponse(
                    files=structured_response.files,
                    explanation=structured_response.explanation,
                    suggestions=structured_response.suggestions,
                    framework_used=request.framework
                )
            else:
                # Fallback to text parsing
                response = await self.llm_provider.generate_content(prompt)
                parsed_response = self._parse_json_response(response)
                
                result = GenerateCodeResponse(
                    files=parsed_response.get("files", {}),
                    explanation=parsed_response.get("explanation", "Code generated successfully"),
                    suggestions=parsed_response.get("suggestions", []),
                    framework_used=request.framework
                )
            
            # Cache the result (cache for 1 hour)
            await self.cache_service.set(
                cache_key, 
                result.model_dump(), 
                ttl=3600
            )
            
            logger.info("Code generation completed", files_count=len(result.files))
            return result
            
        except Exception as e:
            logger.error("Code generation failed", error=str(e))
            if isinstance(e, (LLMException, ValidationException)):
                raise
            raise LLMException(f"Code generation failed: {str(e)}")
    
    async def generate_code_stream(
        self, 
        request: GenerateCodeRequest
    ) -> AsyncGenerator[str, None]:
        """Generate code with streaming."""
        try:
            logger.info("Starting streaming code generation", framework=request.framework.value)
            
            # Build prompt
            prompt = self._build_generation_prompt(request)
            
            # Stream content
            full_response = ""
            async for chunk in self.llm_provider.generate_content_stream(prompt):
                full_response += chunk
                yield chunk
            
            logger.info("Streaming code generation completed")
            
        except Exception as e:
            logger.error("Streaming code generation failed", error=str(e))
            if isinstance(e, LLMException):
                raise
            raise LLMException(f"Streaming generation failed: {str(e)}")
    
    async def validate_code(self, request: ValidateCodeRequest) -> ValidateCodeResponse:
        """Validate code with caching."""
        try:
            logger.info("Starting code validation", framework=request.framework.value)
            
            # Check cache first
            cache_key = self.cache_service.generate_validation_cache_key(
                files=request.files,
                framework=request.framework.value
            )
            
            cached_result = await self.cache_service.get(cache_key)
            if cached_result:
                logger.info("Cache hit for code validation", cache_key=cache_key)
                return ValidateCodeResponse(**cached_result)
            
            # Build advanced prompt using prompt service
            prompt = self.prompt_service.build_validation_prompt(request)
            
            # Check if provider supports structured output
            if hasattr(self.llm_provider, 'generate_structured_content'):
                # Use structured output with Pydantic validation
                structured_response = await self.llm_provider.generate_structured_content(
                    prompt, CodeValidationOutput
                )
                
                result = ValidateCodeResponse(
                    is_valid=structured_response.is_valid,
                    errors=structured_response.errors,
                    warnings=structured_response.warnings,
                    suggestions=structured_response.suggestions
                )
            else:
                # Fallback to text parsing
                response = await self.llm_provider.generate_content(prompt)
                parsed_response = self._parse_json_response(response)
                
                result = ValidateCodeResponse(
                    is_valid=parsed_response.get("is_valid", False),
                    errors=parsed_response.get("errors", []),
                    warnings=parsed_response.get("warnings", []),
                    suggestions=parsed_response.get("suggestions", [])
                )
            
            # Cache the result (cache for 30 minutes)
            await self.cache_service.set(
                cache_key, 
                result.model_dump(), 
                ttl=1800
            )
            
            logger.info("Code validation completed", is_valid=result.is_valid)
            return result
            
        except Exception as e:
            logger.error("Code validation failed", error=str(e))
            if isinstance(e, (LLMException, ValidationException)):
                raise
            raise LLMException(f"Code validation failed: {str(e)}")