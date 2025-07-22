"""
Domain models and enums.
"""

from pydantic import BaseModel
from enum import Enum
from typing import Literal


class Framework(str, Enum):
    """Supported frameworks for code generation."""
    REACT = "react"
    VUE = "vue"
    SVELTE = "svelte"
    ANGULAR = "angular"
    NODEJS = "nodejs"


class ConversationMessage(BaseModel):
    """A message in the conversation history."""
    role: Literal["user", "assistant"]
    content: str