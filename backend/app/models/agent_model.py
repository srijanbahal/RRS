# app/models/agent_model.py
from pydantic import BaseModel, Field
from typing import Optional, Dict
import uuid

class AgentType:
    LLM = "LLM"
    RL = "RL"
    HYBRID = "HYBRID"

class Agent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str = AgentType.LLM      # default LLM initially
    personality: Optional[str] = None  # e.g., "aggressive", "conservative"
    team: Optional[str] = None
    config: Dict = Field(default_factory=dict)  # any agent-specific config (model path, prompt templates, etc.)
    created_at: float = Field(default_factory=lambda: __import__("time").time())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "personality": self.personality,
            "team": self.team,
            "config": self.config,
            "created_at": self.created_at
        }
