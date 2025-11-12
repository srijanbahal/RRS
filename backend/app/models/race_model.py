from pydantic import BaseModel, Field
from typing import Dict, Optional
from .cars_model import Car
from .circuit_model import Circuit
import time, uuid

class RaceStatus:
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    FINISHED = "FINISHED"
    CANCELLED = "CANCELLED"


class Race(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    db_id: Optional[str] = None
    name: str = "Unnamed Race"
    circuit: Optional[Circuit] = None
    max_laps: int = 3
    current_lap: int = 0
    cars: Dict[str, Car] = Field(default_factory=dict)
    created_at: float = Field(default_factory=time.time)
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    status: str = RaceStatus.PENDING
    metadata: Dict = Field(default_factory=dict)

    def add_car(self, car: Car):
        self.cars[car.id] = car

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status,
            "max_laps": self.max_laps,
            "current_lap": self.current_lap,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "circuit": self.circuit.to_dict() if self.circuit else None,
            "cars": {cid: car.to_dict() for cid, car in self.cars.items()},
        }
