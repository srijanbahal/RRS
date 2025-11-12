# app/models/circuit_model.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid

class Waypoint(BaseModel):
    x: float
    y: float
    speed_limit: Optional[float] = None  # optional advisory speed at waypoint (m/s)
    name: Optional[str] = None

class Circuit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    track_length: float = 5000.0   # meters, default 5km lap
    waypoints: List[Waypoint] = Field(default_factory=list)
    pit_positions: List[Dict] = Field(default_factory=list)   # list of {"x":..., "y":..., "length":...}
    start_position: Dict = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})
    description: Optional[str] = None

    def get_nearest_waypoint_idx(self, x: float, y: float) -> int:
        """Return index of nearest waypoint — naive linear search (OK for small lists)."""
        best_idx = 0
        best_dist = float("inf")
        for idx, wp in enumerate(self.waypoints):
            dx = wp.x - x
            dy = wp.y - y
            d = dx*dx + dy*dy
            if d < best_dist:
                best_dist = d
                best_idx = idx
        return best_idx

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "track_length": self.track_length,
            "waypoints": [wp.model_dump() for wp in self.waypoints],
            "pit_positions": self.pit_positions,
            "start_position": self.start_position,
            "description": self.description
        }
