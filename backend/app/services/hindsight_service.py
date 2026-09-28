import os

from dotenv import load_dotenv
from hindsight_client import Hindsight


load_dotenv()


class HindsightService:
    """Wrapper around the Hindsight client for OpsMemory."""

    def __init__(self) -> None:
        self.base_url = os.getenv(
            "HINDSIGHT_API_URL",
            "https://api.hindsight.vectorize.io",
        )

        self.api_key = os.getenv("HINDSIGHT_API_KEY")

        self.bank_id = os.getenv(
            "HINDSIGHT_BANK_ID",
            "OpsMemory Incident Memory",
        )

        if not self.api_key:
            raise ValueError(
                "HINDSIGHT_API_KEY is missing. "
                "Add it to your local .env file."
            )

        self.client = Hindsight(
            base_url=self.base_url,
            api_key=self.api_key,
        )

    def retain(self, content: str) -> None:
        """Store incident knowledge in Hindsight."""

        self.client.retain(
            bank_id=self.bank_id,
            content=content,
        )

    def recall(self, query: str) -> list[dict]:
        """Retrieve relevant incident memories from Hindsight."""

        results = self.client.recall(
            bank_id=self.bank_id,
            query=query,
        )

        memories = []

        for result in results:
            score = None

            if getattr(result, "scores", None) is not None:
                score = getattr(result.scores, "final", None)

            memories.append(
                {
                    "text": result.text,
                    "score": score,
                }
            )

        return memories

    def close(self) -> None:
        """Close the Hindsight client."""

        self.client.close()