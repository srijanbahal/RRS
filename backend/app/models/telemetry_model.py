from pydantic import BaseModel
from typing import Dict

class Telemetry(BaseModel):
    agent: str
    lap: int
    speed: float
    decision: Dict
