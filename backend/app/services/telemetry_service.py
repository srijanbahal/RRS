# app/services/telemetry_service.py
"""
TelemetryService

Responsibilities:
- Buffer telemetry points in-memory per race (fast).
- Provide read helpers for the most recent telemetry points.
- Periodically flush buffered telemetry to Postgres in batches (non-blocking).
- Safely handle DB errors and support graceful shutdown.

Usage:
- Create a single shared instance:
    telemetry_svc = TelemetryService()
- Call `await telemetry_svc.start()` once during app startup (starts flusher task).
- Call `await telemetry_svc.record(race_id, telemetry_dict)` from RaceService._race_loop().
- Use `await telemetry_svc.get_latest(race_id, limit=20)` from endpoints/WS to fetch recent telemetry.
- Call `await telemetry_svc.stop()` during shutdown to flush remaining items.
"""

import asyncio
import json
import os
import time
import logging
from typing import Dict, List, Any, Optional, Tuple

from app.services import db

logger = logging.getLogger("TelemetryService")

# Config via env or defaults
_TELEMETRY_BATCH_SIZE = int(os.getenv("TELEMETRY_BATCH_SIZE", "50"))
_TELEMETRY_FLUSH_INTERVAL = float(os.getenv("TELEMETRY_FLUSH_INTERVAL", "2.0"))
_TELEMETRY_MEMORY_CAP = int(os.getenv("TELEMETRY_MEMORY_CAP", "2000"))  # max points per race kept in memory


class TelemetryService:
    def __init__(
        self,
        batch_size: int = _TELEMETRY_BATCH_SIZE,
        flush_interval: float = _TELEMETRY_FLUSH_INTERVAL,
        memory_cap: int = _TELEMETRY_MEMORY_CAP,
    ):
        # buffers: race_id -> list[telemetry_dict]
        self._buffers: Dict[str, List[Dict[str, Any]]] = {}
        # locks: race_id -> asyncio.Lock to protect per-race buffer
        self._locks: Dict[str, asyncio.Lock] = {}
        self._batch_size = batch_size
        self._flush_interval = flush_interval
        self._memory_cap = memory_cap

        # background flusher task
        self._flusher_task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()

    # -------------------------
    # Internal helpers
    # -------------------------
    def _ensure_race(self, race_id: str):
        if race_id not in self._buffers:
            self._buffers[race_id] = []
            self._locks[race_id] = asyncio.Lock()

    def _serialize_position(self, pos: Any) -> Any:
        # Ensure position is JSON-serializable (list/dict)
        if pos is None:
            return {}
        if isinstance(pos, (list, dict)):
            return pos
        # if tuple, convert to list
        try:
            return list(pos)
        except Exception:
            return {"x": None}

    # -------------------------
    # Public API
    # -------------------------
    async def start(self):
        """Start the background flusher. Call once at app startup."""
        if self._flusher_task and not self._flusher_task.done():
            return
        self._stop_event.clear()
        self._flusher_task = asyncio.create_task(self._flusher_loop())
        logger.info("TelemetryService flusher started.")

    async def stop(self):
        """Stop flusher and flush remaining buffers to DB."""
        self._stop_event.set()
        if self._flusher_task:
            await self._flusher_task
        # flush everything synchronously
        await self.flush_all()

    async def record(self, race_id: str, telemetry: Dict[str, Any]):
        """
        Record a telemetry point into the in-memory buffer.
        telemetry: dict expected to contain keys like:
          - entry_id, car_id, agent_id, lap, speed, position, orientation, decision, timestamp
        """
        self._ensure_race(race_id)
        async with self._locks[race_id]:
            # normalize some fields
            telemetry = dict(telemetry)  # shallow copy
            telemetry.setdefault("timestamp", time.time())
            telemetry["position"] = self._serialize_position(telemetry.get("position"))
            buffer = self._buffers[race_id]
            buffer.append(telemetry)
            # cap memory for this race
            if len(buffer) > self._memory_cap:
                # drop oldest points
                to_drop = len(buffer) - self._memory_cap
                del buffer[0:to_drop]

    async def get_latest(self, race_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Return the latest `limit` telemetry points from buffer for race_id."""
        if race_id not in self._buffers:
            return []
        async with self._locks[race_id]:
            data = list(self._buffers[race_id][-limit:])
            return data

    async def get_last_n_for_entry(self, race_id: str, entry_id: str, n: int = 20) -> List[Dict[str, Any]]:
        """Get last n telemetry points for a specific entry_id from buffer."""
        if race_id not in self._buffers:
            return []
        async with self._locks[race_id]:
            buf = self._buffers[race_id]
            results = []
            for t in reversed(buf):
                if t.get("entry_id") == entry_id:
                    results.append(t)
                    if len(results) >= n:
                        break
            return list(reversed(results))

    async def get_since(self, race_id: str, since_ts: float) -> List[Dict[str, Any]]:
        """Return telemetry points with timestamp >= since_ts."""
        if race_id not in self._buffers:
            return []
        async with self._locks[race_id]:
            return [t for t in self._buffers[race_id] if t.get("timestamp", 0) >= since_ts]

    # -------------------------
    # Persistence / flushing
    # -------------------------
    async def flush_for_race(self, race_id: str):
        """Flush buffered telemetry for a single race into DB in batches."""
        if race_id not in self._buffers:
            return
        # obtain lock and swap buffer
        async with self._locks[race_id]:
            batch = list(self._buffers[race_id])
            self._buffers[race_id].clear()

        if not batch:
            return

        # prepare batch insert arguments for telemetry table
        q = """
        INSERT INTO telemetry (race_id, entry_id, car_id, ts, tick_interval_ms, lap, speed, position, orientation, decision, sample)
        VALUES ($1, $2, to_timestamp($3), $4, $5, $6, $7::jsonb, $8::float8, $9::jsonb)
        """
        # NOTE: The schema and query must match your telemetry table. We'll build a generic version below.
        # Safer approach: use a canonical insert shaped for the schema declared earlier.
        insert_q = """
        INSERT INTO telemetry (race_id, entry_id, car_id, ts, tick_interval_ms, lap, speed, position, orientation, decision, sample)
        VALUES ($1, $2, $3, to_timestamp($4), $5, $6, $7, $8::jsonb, $9, $10::jsonb)
        """

        args_list = []
        for t in batch:
            # Convert timestamp to epoch seconds for portability in the query
            ts = float(t.get("timestamp", time.time()))
            args = (
                t.get("race_id"),
                t.get("entry_id"),
                t.get("car_id"),
                ts,
                int(t.get("tick_interval_ms", 0)),
                int(t.get("lap", 0)),
                float(t.get("speed", 0.0)),
                json.dumps(t.get("position", {})),
                float(t.get("orientation", 0.0)) if t.get("orientation") is not None else 0.0,
                json.dumps({
                    "decision": t.get("decision"),
                    "extra": t.get("sample", {})
                }),
            )
            args_list.append(args)

        # execute in chunks to avoid huge single queries
        chunk_size = max(1, min(self._batch_size, 500))
        try:
            for i in range(0, len(args_list), chunk_size):
                chunk = args_list[i : i + chunk_size]
                # db.executemany expects a query and a list of tuples
                await db.executemany(insert_q, chunk)
        except Exception as e:
            # If DB write fails, push back the batch to buffer (best effort)
            logger.exception(f"Failed to flush telemetry batch for race {race_id}: {e}")
            async with self._locks[race_id]:
                # prepend failed chunk back to buffer (keep order)
                existing = self._buffers.get(race_id, [])
                self._buffers[race_id] = chunk_to_telemetry_dicts(chunk) + existing  # helper below

    async def flush_all(self):
        """Flush buffers for all races."""
        race_ids = list(self._buffers.keys())
        for rid in race_ids:
            try:
                await self.flush_for_race(rid)
            except Exception as e:
                logger.exception(f"Error flushing telemetry for race {rid}: {e}")

    # -------------------------
    # Background flusher loop
    # -------------------------
    async def _flusher_loop(self):
        try:
            while not self._stop_event.is_set():
                # snapshot race ids
                race_ids = list(self._buffers.keys())
                flush_tasks = [self.flush_for_race(rid) for rid in race_ids]
                if flush_tasks:
                    # run flushes concurrently, but limit concurrency implicitly by number of races
                    await asyncio.gather(*flush_tasks, return_exceptions=True)
                # sleep
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=self._flush_interval)
                except asyncio.TimeoutError:
                    continue
        except Exception as e:
            logger.exception(f"TelemetryService flusher encountered an error: {e}")
        finally:
            # final flush on exit
            try:
                await self.flush_all()
            except Exception as e:
                logger.exception(f"TelemetryService final flush failed: {e}")

# -------------------------
# Helper to reconstruct telemetry dicts if flush failed and we want to restore
# -------------------------
def chunk_to_telemetry_dicts(chunk_args: List[Tuple]) -> List[Dict[str, Any]]:
    """
    Convert the argument tuples used in insert back to telemetry dicts.
    This is used when DB insert fails and we want to restore them into buffer.
    The conversion must match the insertion argument order used in flush_for_race().
    """
    out = []
    for args in chunk_args:
        try:
            telemetry = {
                "race_id": args[0],
                "entry_id": args[1],
                "car_id": args[2],
                "timestamp": float(args[3]),
                "tick_interval_ms": int(args[4]),
                "lap": int(args[5]),
                "speed": float(args[6]),
                "position": json.loads(args[7]) if isinstance(args[7], str) else args[7],
                "orientation": float(args[8]) if args[8] is not None else 0.0,
                "decision": (json.loads(args[9]) if isinstance(args[9], str) else args[9]).get("decision") if args[9] else None,
                "sample": (json.loads(args[9]) if isinstance(args[9], str) else args[9]).get("extra") if args[9] else None
            }
        except Exception:
            telemetry = {"race_id": args[0], "timestamp": time.time()}
        out.append(telemetry)
    return out


# singleton instance
telemetry_svc = TelemetryService()
