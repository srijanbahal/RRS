# app/models/car_model.py
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
import math
import time
import uuid

Decision = Dict[str, float]  # {"throttle":0-1, "steer":-1..1, "brake":0-1}

class Car(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: Optional[str] = None           # which agent controls this car
    team: Optional[str] = None
    position: List[float] = Field(default_factory=lambda: [0.0, 0.0])  # (x, y) on track coordinate space
    speed: float = 0.0                       # meters per second
    acceleration: float = 0.0                # m/s^2
    orientation: float = 0.0                 # heading in radians
    fuel: float = 100.0                      # percent
    tire_wear: float = 0.0                   # percent (0 good -> 100 worn)
    damage: float = 0.0                      # percent (0 none -> 100 destroyed)
    lap: int = 1
    lap_distance: float = 0.0                # distance progressed along current lap in meters
    total_distance: float = 0.0              # total distance covered in meters
    status: str = "RUNNING"                  # RUNNING / PIT / CRASHED / FINISHED
    last_update_ts: float = Field(default_factory=time.time)

    # Physics params: tweakable constants
    mass: float = 800.0                      # kg, light F1-like car
    max_speed: float = 95.0                  # m/s (~342 km/h) top speed placeholder
    max_accel: float = 20.0                  # m/s^2 (conceptual)
    braking_factor: float = 2.0              # how strongly brakes decelerate
    steering_sensitivity: float = 0.05       # how orientation changes per steer input per tick
    fuel_consumption_base: float = 0.0005    # per meter * speed factor
    tire_wear_base: float = 0.0001           # per meter * speed factor

    class Config:
        validate_assignment = True

    @validator("speed")
    def clamp_speed(cls, v):
        if v < 0:
            return 0.0
        return v

    def apply_decision(self, decision: Decision, dt: float = 1.0):
        """
        Apply an agent's decision to update acceleration/speed/position.
        decision: {"throttle": 0..1, "steer": -1..1, "brake": 0..1}
        dt: timestep seconds
        """
        throttle = float(decision.get("throttle", 0.0))
        steer = float(decision.get("steer", 0.0))
        brake = float(decision.get("brake", 0.0))

        # Compute acceleration: throttle gives forward acceleration,
        # brake gives negative acceleration scaled by braking_factor.
        engine_accel = (throttle * self.max_accel)
        brake_accel = (brake * self.max_accel * self.braking_factor)
        net_accel = engine_accel - brake_accel

        # small penalty for high tire wear / damage and fuel level
        wear_penalty = max(0.0, self.tire_wear / 200.0)      # up to 0.5
        damage_penalty = max(0.0, self.damage / 200.0)      # up to 0.5
        fuel_penalty = 0.0 if self.fuel > 10 else (1 - self.fuel / 10.0)  # big penalty if near 0

        penalty = wear_penalty + damage_penalty + fuel_penalty

        # apply penalty
        net_accel = net_accel * max(0.0, 1.0 - penalty)

        # Update kinematics
        self.acceleration = net_accel
        new_speed = self.speed + self.acceleration * dt
        # clamp speed to [0, max_speed]
        self.speed = max(0.0, min(self.max_speed, new_speed))

        # Update orientation based on steering and current speed
        # steering effect scales with speed (can't turn much at low speed physically but we keep simple)
        orientation_change = steer * self.steering_sensitivity * (self.speed / max(1.0, self.max_speed))
        self.orientation += orientation_change

        # Convert orientation + speed -> position change (simple forward along heading)
        dx = math.cos(self.orientation) * self.speed * dt
        dy = math.sin(self.orientation) * self.speed * dt
        self.position[0] += dx
        self.position[1] += dy

        # Update distances
        distance_travelled = math.sqrt(dx*dx + dy*dy)
        self.lap_distance += distance_travelled
        self.total_distance += distance_travelled

        # Fuel consumption & tire wear
        self.fuel = max(0.0, self.fuel - (self.fuel_consumption_base * (1 + throttle) * distance_travelled))
        self.tire_wear = min(100.0, self.tire_wear + (self.tire_wear_base * (1 + abs(steer)) * distance_travelled))

        # timestamp update
        self.last_update_ts = time.time()

        return {
            "position": list(self.position),
            "speed": float(self.speed),
            "acceleration": float(self.acceleration),
            "orientation": float(self.orientation),
            "fuel": float(self.fuel),
            "tire_wear": float(self.tire_wear),
            "total_distance": float(self.total_distance),
            "lap_distance": float(self.lap_distance),
            "status": self.status
        }

    def to_dict(self) -> Dict:
        """Return serializable dict for telemetry."""
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "team": self.team,
            "position": [float(self.position[0]), float(self.position[1])],
            "speed": float(self.speed),
            "acceleration": float(self.acceleration),
            "orientation": float(self.orientation),
            "fuel": float(self.fuel),
            "tire_wear": float(self.tire_wear),
            "damage": float(self.damage),
            "lap": int(self.lap),
            "lap_distance": float(self.lap_distance),
            "total_distance": float(self.total_distance),
            "status": self.status,
            "last_update_ts": self.last_update_ts
        }
