"""Loads versioned prompt templates from /prompts. Prompts are never
hardcoded inline in agents or services."""

from pathlib import Path
from string import Template

PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts"


class PromptBuilder:
    def __init__(self, template_name: str) -> None:
        self._path = PROMPTS_DIR / template_name
        if not self._path.exists():
            raise FileNotFoundError(f"Prompt template not found: {self._path}")

    def build(self, **variables: str) -> str:
        template = Template(self._path.read_text(encoding="utf-8"))
        return template.substitute(**variables)
