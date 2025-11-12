from pydantic import BaseModel, Field
from typing import Optional, Dict
import uuid, time

class AgentType:
    LLM = "LLM"
    RL = "RL"
    HYBRID = "HYBRID"


class Agent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    db_id: Optional[str] = None  # link to DB row if persisted
    name: str
    type: str = AgentType.LLM
    personality: Optional[str] = None  # e.g. "aggressive"
    team_id: Optional[str] = None
    config: Dict = Field(default_factory=dict)
    model_provider: Optional[str] = None  # "openai", "groq", etc.
    created_at: float = Field(default_factory=time.time)

    def to_dict(self):
        return {
            "id": self.id,
            "db_id": self.db_id,
            "name": self.name,
            "type": self.type,
            "personality": self.personality,
            "team_id": self.team_id,
            "config": self.config,
            "model_provider": self.model_provider,
            "created_at": self.created_at
        }
