from pydantic import BaseModel
from typing import List, Optional

class Race(BaseModel):
    id: str
    name: str
    track: str
    laps: int
    agents: List[str] = []
    status: str = "PENDING"
