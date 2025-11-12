from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
import math, time, uuid

Decision = Dict[str, float]

class Car(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    db_id: Optional[str] = None
    agent_id: Optional[str] = None
    team_id: Optional[str] = None
    entry_id: Optional[str] = None  # race_entries.id if persisted
    position: List[float] = Field(default_factory=lambda: [0.0, 0.0])
    speed: float = 0.0
    acceleration: float = 0.0
    orientation: float = 0.0
    fuel: float = 100.0
    tire_wear: float = 0.0
    damage: float = 0.0
    lap: int = 1
    lap_distance: float = 0.0
    total_distance: float = 0.0
    status: str = "RUNNING"
    last_update_ts: float = Field(default_factory=time.time)
    created_at: float = Field(default_factory=time.time)

    # Physics constants
    mass: float = 800.0
    max_speed: float = 95.0
    max_accel: float = 20.0
    braking_factor: float = 2.0
    steering_sensitivity: float = 0.05
    fuel_consumption_base: float = 0.0005
    tire_wear_base: float = 0.0001

    class Config:
        validate_assignment = True

    @validator("speed")
    def clamp_speed(cls, v):
        return max(0.0, v)

    def apply_decision(self, decision: Decision, dt: float = 1.0):
        throttle = float(decision.get("throttle", 0.0))
        steer = float(decision.get("steer", 0.0))
        brake = float(decision.get("brake", 0.0))

        engine_accel = throttle * self.max_accel
        brake_accel = brake * self.max_accel * self.braking_factor
        net_accel = engine_accel - brake_accel

        penalty = (self.tire_wear + self.damage) / 200.0
        if self.fuel < 10:
            penalty += 1 - self.fuel / 10.0

        self.acceleration = net_accel * max(0.0, 1 - penalty)
        self.speed = max(0.0, min(self.max_speed, self.speed + self.acceleration * dt))

        self.orientation += steer * self.steering_sensitivity * (self.speed / max(1, self.max_speed))
        dx = math.cos(self.orientation) * self.speed * dt
        dy = math.sin(self.orientation) * self.speed * dt
        self.position[0] += dx
        self.position[1] += dy

        distance = math.sqrt(dx**2 + dy**2)
        self.lap_distance += distance
        self.total_distance += distance
        self.fuel = max(0.0, self.fuel - self.fuel_consumption_base * distance)
        self.tire_wear = min(100.0, self.tire_wear + self.tire_wear_base * distance)
        self.last_update_ts = time.time()

    def to_dict(self) -> Dict:
        return self.model_dump()
