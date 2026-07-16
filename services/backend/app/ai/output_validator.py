"""Shared Output Validator step: every agent's raw LLM text response passes
through here before the application ever sees it."""

import json
import re

_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


class OutputValidationError(Exception):
    pass


def parse_json_response(content: str) -> dict:
    """Parse a JSON object out of an LLM response, tolerating markdown code
    fences some models wrap JSON output in even when asked not to."""

    cleaned = _CODE_FENCE_RE.sub("", content).strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise OutputValidationError(f"LLM response was not valid JSON: {exc}") from exc

    if not isinstance(parsed, dict):
        raise OutputValidationError("LLM response JSON was not an object")

    return parsed


def require_keys(payload: dict, *keys: str) -> None:
    missing = [key for key in keys if key not in payload]
    if missing:
        raise OutputValidationError(f"LLM response JSON missing required keys: {missing}")
