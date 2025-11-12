from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import time

class Telemetry(BaseModel):
    event: str = "telemetry-update"
    race_id: str
    car_id: str
    agent_id: str
    team_id: Optional[str] = None
    entry_id: Optional[str] = None
    lap: int
    speed: float
    position: list
    decision: Dict[str, float]
    fuel: Optional[float] = None
    tire_wear: Optional[float] = None
    timestamp: float = Field(default_factory=time.time)
    extra: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self):
        return self.model_dump()
