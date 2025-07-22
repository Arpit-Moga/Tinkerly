"""
Advanced prompt service with framework-specific optimization.
"""

from typing import List, Dict, Any
from app.models import GenerateCodeRequest, ValidateCodeRequest
from app.models.domain import Framework, ConversationMessage
from app.services.prompts.framework_templates import FrameworkTemplates
import structlog

logger = structlog.get_logger()


class PromptService:
    """Advanced prompt engineering service."""
    
    def __init__(self):
        self.templates = FrameworkTemplates()
    
    def build_generation_prompt(self, request: GenerateCodeRequest) -> str:
        """Build optimized generation prompt with framework-specific templates."""
        try:
            # Get framework-specific template
            framework_template = self.templates.get_generation_template(request.framework)
            
            # Build conversation context
            conversation_context = self._build_conversation_context(request.conversation_history)
            
            # Build current files context
            files_context = self._build_files_context(request.current_files)
            
            # Build user requirements
            user_requirements = self._build_user_requirements(request.prompt, request.framework)
            
            # Combine all parts
            prompt = f"""
{framework_template}

{user_requirements}

{conversation_context}

{files_context}

RESPONSE FORMAT:
You must respond with a valid JSON object containing:
{{
    "files": {{
        "filename1": "complete_file_content1",
        "filename2": "complete_file_content2"
    }},
    "explanation": "Brief explanation of what was created and key features",
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}}

IMPORTANT:
- Ensure all file content is complete and production-ready
- Include proper error handling and validation
- Follow the framework's best practices and conventions
- Make the code maintainable and well-documented
- Ensure the JSON response is valid and properly escaped
"""
            
            logger.info("Generation prompt built", 
                       framework=request.framework.value,
                       prompt_length=len(prompt))
            
            return prompt
            
        except Exception as e:
            logger.error("Failed to build generation prompt", error=str(e))
            return self._build_fallback_prompt(request)
    
    def build_validation_prompt(self, request: ValidateCodeRequest) -> str:
        """Build optimized validation prompt with framework-specific analysis."""
        try:
            # Get framework-specific validation template
            validation_template = self.templates.get_validation_template(request.framework)
            
            # Build files content
            files_content = self._build_files_for_validation(request.files)
            
            # Get optimization suggestions
            optimization_suggestions = self.templates.get_optimization_suggestions(request.framework)
            
            prompt = f"""
{validation_template}

CODE TO ANALYZE:
{files_content}

ANALYSIS FOCUS:
{self._build_analysis_focus(request.framework, optimization_suggestions)}

RESPONSE FORMAT:
You must respond with a valid JSON object containing:
{{
    "is_valid": true/false,
    "errors": ["error1", "error2"],
    "warnings": ["warning1", "warning2"],
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}}

IMPORTANT:
- Provide specific, actionable feedback
- Include line numbers or code snippets where relevant
- Focus on {request.framework.value}-specific best practices
- Ensure the JSON response is valid and properly formatted
"""
            
            logger.info("Validation prompt built", 
                       framework=request.framework.value,
                       files_count=len(request.files))
            
            return prompt
            
        except Exception as e:
            logger.error("Failed to build validation prompt", error=str(e))
            return self._build_fallback_validation_prompt(request)
    
    def _build_conversation_context(self, history: List[ConversationMessage]) -> str:
        """Build conversation context from history."""
        if not history:
            return ""
        
        context = "\nCONVERSATION CONTEXT:\n"
        # Use last 5 messages for context
        recent_messages = history[-5:] if len(history) > 5 else history
        
        for msg in recent_messages:
            context += f"{msg.role.upper()}: {msg.content[:200]}...\n"
        
        context += "\nPlease consider this conversation context when generating the code.\n"
        return context
    
    def _build_files_context(self, current_files: Dict[str, str]) -> str:
        """Build current files context."""
        if not current_files:
            return ""
        
        context = "\nCURRENT PROJECT FILES:\n"
        for filename, content in current_files.items():
            # Truncate large files for context
            truncated_content = content[:500] + "..." if len(content) > 500 else content
            context += f"\n--- {filename} ---\n{truncated_content}\n"
        
        context += "\nPlease consider these existing files when generating new code. Ensure compatibility and consistency.\n"
        return context
    
    def _build_user_requirements(self, prompt: str, framework: Framework) -> str:
        """Build user requirements section."""
        return f"""
USER REQUIREMENTS:
{prompt}

TARGET FRAMEWORK: {framework.value}

Please create a {framework.value} application that fulfills these requirements.
"""
    
    def _build_files_for_validation(self, files: Dict[str, str]) -> str:
        """Build files content for validation."""
        content = ""
        for filename, file_content in files.items():
            content += f"\n--- FILE: {filename} ---\n{file_content}\n"
        return content
    
    def _build_analysis_focus(self, framework: Framework, suggestions: Dict[str, Any]) -> str:
        """Build analysis focus based on framework and suggestions."""
        focus = f"Focus on {framework.value}-specific issues:\n"
        
        if "performance" in suggestions:
            focus += "\nPERFORMANCE CONSIDERATIONS:\n"
            for suggestion in suggestions["performance"][:3]:
                focus += f"- {suggestion}\n"
        
        if "best_practices" in suggestions:
            focus += "\nBEST PRACTICES:\n"
            for suggestion in suggestions["best_practices"][:3]:
                focus += f"- {suggestion}\n"
        
        return focus
    
    def _build_fallback_prompt(self, request: GenerateCodeRequest) -> str:
        """Build fallback prompt if template fails."""
        return f"""
Create a {request.framework.value} application based on this requirement:
{request.prompt}

Please respond with a JSON object containing:
{{
    "files": {{"filename": "content"}},
    "explanation": "Brief explanation",
    "suggestions": ["suggestion1", "suggestion2"]
}}
"""
    
    def _build_fallback_validation_prompt(self, request: ValidateCodeRequest) -> str:
        """Build fallback validation prompt if template fails."""
        files_content = ""
        for filename, content in request.files.items():
            files_content += f"\n--- {filename} ---\n{content}\n"
        
        return f"""
Validate this {request.framework.value} code:
{files_content}

Respond with JSON:
{{
    "is_valid": true/false,
    "errors": ["error1"],
    "warnings": ["warning1"],
    "suggestions": ["suggestion1"]
}}
"""