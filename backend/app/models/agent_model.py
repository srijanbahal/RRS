from pydantic import BaseModel
from typing import Optional, Dict

class Agent(BaseModel):
    id: str
    name: str
    personality: str
    team: Optional[str]
    config: Optional[Dict] = {}
