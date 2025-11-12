# app/models/telemetry_model.py
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import time

class Telemetry(BaseModel):
    event: str = "telemetry-update"
    race_id: str
    car_id: str
    agent_id: str
    lap: int
    speed: float
    position: list
    decision: Dict[str, float]
    fuel: Optional[float] = None
    tire_wear: Optional[float] = None
    timestamp: float = Field(default_factory=lambda: time.time())
    extra: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self):
        data = self.model_dump()
        # ensure all floats are serializable (pydantic handles this)
        return data
