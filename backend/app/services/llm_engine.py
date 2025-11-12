"""
LLMDecisionEngine — Unified Interface for Multiple LLM Providers.

Supported providers:
  - OpenAI     (Chat Completions API)
  - Groq       (OpenAI-compatible endpoint)
  - Gemini     (Google Generative Language API)
  - Mock       (Deterministic/random fallback)

Contract:
  async def decide(self, state: dict) -> dict:
      Returns driving control decision:
      {
          "throttle": float,  # 0–1
          "steer": float,     # -1–1
          "brake": float      # 0–1
      }

Configuration via .env:
  LLM_PROVIDER=openai|groq|gemini|mock
  OPENAI_API_KEY=
  GROQ_API_KEY=
  GEMINI_API_KEY=
  LLM_MODEL=gpt-4o-mini
  LLM_TIMEOUT=3
  LLM_RETRIES=2
"""

import os
import asyncio
import json
import random
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger("LLMDecisionEngine")

# --------------------------------------------------------------------------
# CONFIGURATION
# --------------------------------------------------------------------------
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock").lower()  # openai|groq|gemini|mock
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Endpoints (Groq is OpenAI-compatible)
OPENAI_URL = os.getenv("OPENAI_API_URL", "https://api.openai.com/v1/chat/completions")
GROQ_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
GEMINI_URL = os.getenv("GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1beta/models")

# Runtime params
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "3.0"))
LLM_RETRIES = int(os.getenv("LLM_RETRIES", "2"))

# --------------------------------------------------------------------------
# HELPERS
# --------------------------------------------------------------------------
def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))

def _clamp_decision(dec: Dict[str, Any]) -> Dict[str, float]:
    try:
        t = clamp(float(dec.get("throttle", 0.0)), 0.0, 1.0)
        s = clamp(float(dec.get("steer", 0.0)), -1.0, 1.0)
        b = clamp(float(dec.get("brake", 0.0)), 0.0, 1.0)
        return {"throttle": t, "steer": s, "brake": b}
    except Exception:
        return {"throttle": 0.5, "steer": 0.0, "brake": 0.0}

def extract_json(text: str) -> Dict[str, Any]:
    if not isinstance(text, str):
        return {}
    try:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start:end+1])
    except Exception:
        pass
    try:
        return json.loads(text)
    except Exception:
        return {}

def fallback_controller(state: Dict[str, Any]) -> Dict[str, float]:
    """Simple deterministic rule-based fallback."""
    car = state.get("car", {})
    speed = car.get("speed", 0.0)
    lap = state.get("race", {}).get("lap", 1)
    fuel = car.get("fuel", 1.0)
    base_throttle = 0.7 if fuel > 0.3 else 0.4
    if speed > 50:
        return {"throttle": 0.2, "steer": 0.05, "brake": 0.6}
    return {"throttle": base_throttle, "steer": random.uniform(-0.05, 0.05), "brake": 0.0}


# --------------------------------------------------------------------------
# LLMDecisionEngine CLASS
# --------------------------------------------------------------------------
class LLMDecisionEngine:
    def __init__(self):
        self.provider = LLM_PROVIDER
        self.model = LLM_MODEL
        self.client = httpx.AsyncClient(timeout=LLM_TIMEOUT)
        logger.info(f"Initialized LLMDecisionEngine with provider={self.provider}, model={self.model}")

    # -------------------- Provider Selectors --------------------
    async def _call_openai_compatible(self, prompt: str, api_key: str, base_url: str) -> Dict[str, float]:
        """For OpenAI or Groq (both follow OpenAI-compatible chat format)."""
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are an F1 AI driver. Respond only with JSON: {throttle, steer, brake}."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 80
        }

        for attempt in range(LLM_RETRIES + 1):
            try:
                resp = await self.client.post(base_url, headers=headers, json=body)
                resp.raise_for_status()
                data = resp.json()
                msg = data["choices"][0]["message"]["content"]
                parsed = extract_json(msg)
                if parsed:
                    return _clamp_decision(parsed)
            except Exception as e:
                logger.warning(f"{self.provider.upper()} call failed (attempt {attempt}): {e}")
                await asyncio.sleep(0.2 * (attempt + 1))

        return _clamp_decision(fallback_controller({}))

    async def _call_gemini(self, prompt: str, api_key: str) -> Dict[str, float]:
        """Gemini requires a slightly different schema."""
        url = f"{GEMINI_URL}/{self.model}:generateContent?key={api_key}"
        body = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"Content-Type": "application/json"}

        for attempt in range(LLM_RETRIES + 1):
            try:
                resp = await self.client.post(url, headers=headers, json=body)
                resp.raise_for_status()
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = extract_json(text)
                if parsed:
                    return _clamp_decision(parsed)
            except Exception as e:
                logger.warning(f"GEMINI call failed (attempt {attempt}): {e}")
                await asyncio.sleep(0.2 * (attempt + 1))

        return _clamp_decision(fallback_controller({}))

    # -------------------- Main Decision Interface --------------------
    async def decide(self, state: Dict[str, Any]) -> Dict[str, float]:
        """Selects backend based on provider, returns driving decision."""
        if self.provider == "mock":
            # Basic random / heuristic blend
            base = fallback_controller(state)
            noise = {
                "throttle": random.uniform(-0.05, 0.05),
                "steer": random.uniform(-0.1, 0.1),
                "brake": random.uniform(-0.02, 0.02),
            }
            merged = {k: base[k] + noise.get(k, 0.0) for k in base}
            return _clamp_decision(merged)

        # Compose compact prompt
        car = state.get("car", {})
        race = state.get("race", {})
        track = state.get("track", {})
        prompt = (
            f"Race {race.get('id','')} | Lap {race.get('lap',1)}/{race.get('max_laps',5)} | "
            f"Speed={car.get('speed',0):.1f} | Fuel={car.get('fuel',1.0):.2f} | "
            f"Track Length={track.get('length',5000.0)}. "
            "Return ONLY JSON: {\"throttle\":float, \"steer\":float, \"brake\":float}"
        )

        try:
            if self.provider == "openai" and OPENAI_API_KEY:
                return await self._call_openai_compatible(prompt, OPENAI_API_KEY, OPENAI_URL)
            elif self.provider == "groq" and GROQ_API_KEY:
                return await self._call_openai_compatible(prompt, GROQ_API_KEY, GROQ_URL)
            elif self.provider == "gemini" and GEMINI_API_KEY:
                return await self._call_gemini(prompt, GEMINI_API_KEY)
            else:
                logger.warning(f"LLM provider={self.provider} not configured properly, using fallback.")
                return _clamp_decision(fallback_controller(state))
        except Exception as e:
            logger.error(f"DecisionEngine failure: {e}")
            return _clamp_decision(fallback_controller(state))
