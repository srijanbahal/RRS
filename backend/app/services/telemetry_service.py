"""
# TODO (Teammate)
Handles telemetry aggregation and retrieval.
Later can integrate with MongoDB or Redis cache.
"""

class TelemetryService:
    cache = {}

    def record(self, race_id: str, telemetry: dict):
        self.cache.setdefault(race_id, []).append(telemetry)

    def get_latest(self, race_id: str):
        return self.cache.get(race_id, [])
