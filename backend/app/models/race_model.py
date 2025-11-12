# app/models/race_model.py
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from .cars_model import Car
from .circuit_model import Circuit
import time
import uuid

class RaceStatus:
    PENDING = "PENDING"
    COUNTDOWN = "COUNTDOWN"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    FINISHED = "FINISHED"
    CANCELLED = "CANCELLED"

class Race(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Unnamed Race"
    circuit: Optional[Circuit] = None
    max_laps: int = 3
    current_lap: int = 0
    cars: Dict[str, Car] = Field(default_factory=dict)  # car_id -> Car
    created_at: float = Field(default_factory=lambda: time.time())
    status: str = RaceStatus.PENDING
    metadata: Dict = Field(default_factory=dict)

    def add_car(self, car: Car):
        self.cars[car.id] = car

    def remove_car(self, car_id: str):
        if car_id in self.cars:
            del self.cars[car_id]

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "circuit": self.circuit.to_dict() if self.circuit else None,
            "max_laps": self.max_laps,
            "current_lap": self.current_lap,
            "cars": {cid: car.to_dict() for cid, car in self.cars.items()},
            "created_at": self.created_at,
            "status": self.status,
            "metadata": self.metadata
        }
