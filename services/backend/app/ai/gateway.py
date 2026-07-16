"""LLM Gateway: the only module allowed to call an LLM provider.

Agents and services must never call Groq (or any future provider) directly.
Swapping providers means changing this module only.
"""

import time
from dataclasses import dataclass

from app.core.config import get_settings
from app.core.http_client import get_http_client

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


@dataclass
class LLMResult:
    content: str
    latency_ms: float
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class LLMGateway:
    def __init__(self, model: str = "llama-3.3-70b-versatile") -> None:
        self._model = model

    async def complete(self, system_prompt: str, user_prompt: str) -> LLMResult:
        settings = get_settings()
        client = get_http_client()

        started_at = time.perf_counter()
        response = await client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            json={
                "model": self._model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        response.raise_for_status()
        latency_ms = (time.perf_counter() - started_at) * 1000

        payload = response.json()
        usage = payload.get("usage", {})

        return LLMResult(
            content=payload["choices"][0]["message"]["content"],
            latency_ms=latency_ms,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
        )
