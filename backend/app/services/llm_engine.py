"""
# TODO (Teammate)
This service calls LLM API (OpenAI/Groq) to make driving decisions.
Contract:
    async def decide(self, state: dict) -> dict:
        Returns:
            {
                "throttle": float,  # 0 to 1
                "steer": float,     # -1 to 1
                "brake": float      # 0 to 1
            }
"""

class LLMDecisionEngine:
    async def decide(self, state: dict) -> dict:
        # Placeholder response
        return {"throttle": 0.6, "steer": 0.0, "brake": 0.0}
