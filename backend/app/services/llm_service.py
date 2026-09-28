import os
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()


class LLMService:
    """Generate incident analysis using an OpenAI-compatible API."""

    def __init__(self) -> None:
        self.api_key = os.getenv("LLM_API_KEY")
        self.base_url = os.getenv("LLM_BASE_URL")
        self.model = os.getenv("LLM_MODEL")

        if not self.api_key:
            raise ValueError(
                "LLM_API_KEY is missing. Add it to your local .env file."
            )

        if not self.model:
            raise ValueError(
                "LLM_MODEL is missing. Add it to your local .env file."
            )

        client_kwargs: dict[str, Any] = {
            "api_key": self.api_key,
        }

        if self.base_url:
            client_kwargs["base_url"] = self.base_url

        self.client = OpenAI(**client_kwargs)

    def analyze_incident(
        self,
        incident: dict[str, Any],
        memories: list[dict[str, Any]],
    ) -> dict[str, str]:
        """Generate structured reasoning from an incident and its memories."""

        memory_text = "\n".join(
            f"- {memory['text']}"
            for memory in memories
        )
        
        prompt = f"""
You are OpsMemory, an AI DevOps incident response assistant.

Analyze the current production incident using historical memories
retrieved from Hindsight.

CURRENT INCIDENT
Service: {incident["service"]}
Environment: {incident["environment"]}
Severity: {incident["severity"]}
Title: {incident["title"]}
Description: {incident["description"]}
Deployment: {incident.get("deployment_version") or "unknown"}

HISTORICAL MEMORY
{memory_text or "- No relevant historical memories found."}

Reasoning rules:
- Use the historical memories as evidence, not as unquestionable truth.
- Clearly distinguish historical evidence from inference.
- Do not invent logs, metrics, traces, deployments, or root causes.
- State uncertainty when evidence is insufficient.
- Recommendations must be suggestions for the human operator.
- Do not claim that any remediation action has already happened.
- Prefer the least risky useful next step.
- When historical memory shows a previous successful resolution,
  mention that connection explicitly.

Return exactly these three sections:

SUMMARY:
A concise explanation of the current incident.

PROBABLE_CAUSE:
The most likely explanation supported by the available evidence.

RECOMMENDED_ACTION:
The safest useful next investigation or remediation step.
"""

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a careful production incident response "
                        "assistant. Use evidence from the incident and "
                        "historical memory. Never invent observations."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        content = response.choices[0].message.content or ""

        return self._parse_response(content)

    @staticmethod
    def _parse_response(content: str) -> dict[str, str]:
        """Parse model output while tolerating markdown formatting."""

        sections = {
            "summary": "",
            "probable_cause": "",
            "recommended_action": "",
        }

        current_section: str | None = None

        for raw_line in content.splitlines():
            line = raw_line.strip()

            normalized = (
                line.replace("**", "")
                .replace("__", "")
                .strip()
                .upper()
            )

            if normalized.startswith("SUMMARY:"):
                current_section = "summary"
                remainder = normalized[len("SUMMARY:"):].strip()

                if remainder:
                    sections["summary"] = remainder

                continue

            if normalized.startswith("PROBABLE_CAUSE:"):
                current_section = "probable_cause"
                remainder = normalized[len("PROBABLE_CAUSE:"):].strip()

                if remainder:
                    sections["probable_cause"] = remainder

                continue

            if normalized.startswith("RECOMMENDED_ACTION:"):
                current_section = "recommended_action"
                remainder = normalized[len("RECOMMENDED_ACTION:"):].strip()

                if remainder:
                    sections["recommended_action"] = remainder

                continue

            if not line:
                continue

            if current_section is not None:
                sections[current_section] += (
                    (" " if sections[current_section] else "")
                    + line
                )

        return sections