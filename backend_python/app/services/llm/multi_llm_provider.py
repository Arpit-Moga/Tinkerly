"""
Multi-LLM provider that supports multiple LLM providers with a common interface.
"""

from typing import AsyncGenerator, Optional, Dict, Any, Type, TypeVar
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

# Import required types for Pydantic v2 compatibility
try:
    from langchain_core.caches import BaseCache
except ImportError:
    try:
        from langchain.cache import BaseCache
    except ImportError:
        class BaseCache:
            pass

try:
    from langchain_core.callbacks.manager import Callbacks
except ImportError:
    try:
        from langchain.callbacks.manager import Callbacks
    except ImportError:
        try:
            from langchain_core.callbacks import Callbacks
        except ImportError:
            # Create dummy Callbacks type
            Callbacks = None

try:
    from langchain_core.callbacks.base import BaseCallbackHandler
except ImportError:
    try:
        from langchain.callbacks.base import BaseCallbackHandler
    except ImportError:
        class BaseCallbackHandler:
            pass

# Import LLM providers with error handling
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    ChatGoogleGenerativeAI = None

try:
    from langchain_openai import ChatOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    ChatOpenAI = None

try:
    from langchain_anthropic import ChatAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    ChatAnthropic = None

try:
    import instructor
    INSTRUCTOR_AVAILABLE = True
except ImportError:
    INSTRUCTOR_AVAILABLE = False
    instructor = None

# Fix Pydantic v2 compatibility issues with all required types
types_namespace = {
    'BaseCache': BaseCache,
    'BaseCallbackHandler': BaseCallbackHandler,
}

# Add Callbacks if available
if Callbacks is not None:
    types_namespace['Callbacks'] = Callbacks

if GEMINI_AVAILABLE and ChatGoogleGenerativeAI:
    try:
        ChatGoogleGenerativeAI.model_rebuild(_types_namespace=types_namespace)
    except Exception as e:
        # Try with minimal namespace
        try:
            ChatGoogleGenerativeAI.model_rebuild(_types_namespace={'BaseCache': BaseCache, 'Callbacks': Callbacks or BaseCallbackHandler})
        except Exception:
            # Last resort - simple rebuild
            try:
                ChatGoogleGenerativeAI.model_rebuild()
            except Exception:
                pass

if OPENAI_AVAILABLE and ChatOpenAI:
    try:
        ChatOpenAI.model_rebuild(_types_namespace=types_namespace)
    except Exception:
        try:
            ChatOpenAI.model_rebuild()
        except Exception:
            pass

if ANTHROPIC_AVAILABLE and ChatAnthropic:
    try:
        ChatAnthropic.model_rebuild(_types_namespace=types_namespace)
    except Exception:
        try:
            ChatAnthropic.model_rebuild()
        except Exception:
            pass

from app.services.abstractions import LLMProvider
from app.core.exceptions import LLMException
from app.config import settings
import structlog

logger = structlog.get_logger()
T = TypeVar('T', bound=BaseModel)


class MultiLLMProvider(LLMProvider):
    """Multi-LLM provider with structured output support."""
    
    def __init__(self, provider_name: Optional[str] = None):
        """Initialize with specified provider or default."""
        self.provider_name = provider_name or settings.default_llm_provider
        self.llm = None
        self.instructor_client = None
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize the appropriate LLM based on provider name."""
        try:
            if self.provider_name == "gemini" and settings.gemini_api_key and GEMINI_AVAILABLE:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    google_api_key=settings.gemini_api_key,
                    temperature=0.1,
                    max_tokens=8192,
                    timeout=60,
                    max_retries=2,
                )
                
            elif self.provider_name == "openai" and settings.openai_api_key and OPENAI_AVAILABLE:
                self.llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    api_key=settings.openai_api_key,
                    temperature=0.1,
                    max_tokens=8192,
                    timeout=60,
                    max_retries=2,
                )
                
            elif self.provider_name == "anthropic" and settings.anthropic_api_key and ANTHROPIC_AVAILABLE:
                self.llm = ChatAnthropic(
                    model="claude-3-5-sonnet-20241022",
                    api_key=settings.anthropic_api_key,
                    temperature=0.1,
                    max_tokens=8192,
                    timeout=60,
                    max_retries=2,
                )
                
            elif self.provider_name == "deepseek" and settings.deepseek_api_key and OPENAI_AVAILABLE:
                self.llm = ChatOpenAI(
                    model="deepseek-chat",
                    api_key=settings.deepseek_api_key,
                    base_url="https://api.deepseek.com",
                    temperature=0.1,
                    max_tokens=8192,
                    timeout=60,
                    max_retries=2,
                )
            else:
                available_providers = self.get_available_providers()
                if not available_providers:
                    raise LLMException("No LLM providers available. Please check your API keys and installed packages.")
                raise LLMException(f"Provider '{self.provider_name}' not available. Available providers: {available_providers}")
            
            # Initialize instructor client for structured outputs
            if INSTRUCTOR_AVAILABLE and instructor:
                try:
                    self.instructor_client = instructor.from_langchain(self.llm)
                except Exception as e:
                    logger.warning("Failed to initialize instructor client, falling back to text parsing", error=str(e))
                    self.instructor_client = None
            else:
                logger.info("Instructor not available, using text parsing fallback")
                self.instructor_client = None
            
            logger.info("LLM initialized successfully", provider=self.provider_name)
            
        except Exception as e:
            logger.error("Failed to initialize LLM", provider=self.provider_name, error=str(e))
            raise LLMException(f"Failed to initialize {self.provider_name}: {str(e)}")
    
    async def generate_content(
        self, 
        prompt: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate content using the configured LLM."""
        try:
            if not self.llm:
                raise LLMException(f"{self.provider_name} LLM not initialized")
            
            message = HumanMessage(content=prompt)
            llm_to_use = self.llm
            
            if config:
                llm_to_use = self.llm.bind(**config)
            
            response = await llm_to_use.ainvoke([message])
            
            logger.info("Content generated successfully", 
                       provider=self.provider_name, 
                       prompt_length=len(prompt))
            return response.content
            
        except Exception as e:
            logger.error("Content generation failed", 
                        provider=self.provider_name, 
                        error=str(e))
            raise LLMException(f"Content generation failed with {self.provider_name}: {str(e)}")
    
    async def generate_structured_content(
        self,
        prompt: str,
        response_model: Type[T],
        config: Optional[Dict[str, Any]] = None
    ) -> T:
        """Generate structured content using Instructor."""
        try:
            if not self.instructor_client:
                # Fallback to regular generation and manual parsing
                logger.info("Using fallback text generation for structured content")
                
                # Add JSON schema instruction to prompt
                schema_prompt = f"""
{prompt}

Please respond with a valid JSON object that matches this schema:
{response_model.model_json_schema()}

Ensure the response is valid JSON and follows the schema exactly.
"""
                
                response_text = await self.generate_content(schema_prompt, config)
                
                # Try to parse as JSON and validate with Pydantic
                import json
                try:
                    # Find JSON in response
                    start_idx = response_text.find('{')
                    end_idx = response_text.rfind('}') + 1
                    
                    if start_idx == -1 or end_idx == 0:
                        raise ValueError("No JSON found in response")
                    
                    json_str = response_text[start_idx:end_idx]
                    json_data = json.loads(json_str)
                    
                    # Validate with Pydantic
                    return response_model(**json_data)
                    
                except (json.JSONDecodeError, ValueError) as e:
                    logger.error("Failed to parse structured response", error=str(e))
                    raise LLMException(f"Invalid structured response: {str(e)}")
            
            # Use instructor if available
            response = await self.instructor_client.achat_completion(
                model=self.llm.model_name if hasattr(self.llm, 'model_name') else "default",
                response_model=response_model,
                messages=[{"role": "user", "content": prompt}],
                **(config or {})
            )
            
            logger.info("Structured content generated successfully", 
                       provider=self.provider_name,
                       response_type=response_model.__name__)
            return response
            
        except Exception as e:
            logger.error("Structured content generation failed", 
                        provider=self.provider_name, 
                        error=str(e))
            raise LLMException(f"Structured generation failed with {self.provider_name}: {str(e)}")
    
    async def generate_content_stream(
        self, 
        prompt: str, 
        config: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """Generate content with streaming."""
        try:
            if not self.llm:
                raise LLMException(f"{self.provider_name} LLM not initialized")
            
            message = HumanMessage(content=prompt)
            llm_to_use = self.llm
            
            if config:
                llm_to_use = self.llm.bind(**config)
            
            async for chunk in llm_to_use.astream([message]):
                if chunk.content:
                    yield chunk.content
                    
        except Exception as e:
            logger.error("Streaming generation failed", 
                        provider=self.provider_name, 
                        error=str(e))
            raise LLMException(f"Streaming generation failed with {self.provider_name}: {str(e)}")
    
    async def is_available(self) -> bool:
        """Check if the LLM provider is available."""
        try:
            if not self.llm:
                return False
            
            test_message = HumanMessage(content="Hello")
            response = await self.llm.ainvoke([test_message])
            return bool(response.content)
            
        except Exception as e:
            logger.warning("LLM availability check failed", 
                          provider=self.provider_name, 
                          error=str(e))
            return False
    
    def get_available_providers(self) -> list[str]:
        """Get list of available providers based on API keys."""
        available = []
        if settings.gemini_api_key:
            available.append("gemini")
        if settings.openai_api_key:
            available.append("openai")
        if settings.anthropic_api_key:
            available.append("anthropic")
        if settings.deepseek_api_key:
            available.append("deepseek")
        return available