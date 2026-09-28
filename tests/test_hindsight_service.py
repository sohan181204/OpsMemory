import os

from dotenv import load_dotenv
from hindsight_client import Hindsight

load_dotenv()


def main():
    api_url = os.getenv("HINDSIGHT_API_URL")
    api_key = os.getenv("HINDSIGHT_API_KEY")
    bank_id = os.getenv("HINDSIGHT_BANK_ID")

    if not api_url:
        raise RuntimeError("HINDSIGHT_API_URL is missing from .env")

    if not api_key:
        raise RuntimeError("HINDSIGHT_API_KEY is missing from .env")

    if not bank_id:
        raise RuntimeError("HINDSIGHT_BANK_ID is missing from .env")

    print("Initializing Hindsight client...")

    client = Hindsight(
        base_url=api_url,
        api_key=api_key,
    )

    print("Connected to Hindsight.")

    print("Retaining test incident memory...")

    client.retain(
        bank_id=bank_id,
        content=(
            "Incident INC-001 affected the payment-api service. "
            "The incident occurred after deployment v2.4.1. "
            "The service returned elevated HTTP 500 errors. "
            "The incident was resolved by rolling back to v2.4.0."
        ),
    )

    print("Memory retained successfully.")

    print("Recalling previous payment-api incident...")

    result = client.recall(
        bank_id=bank_id,
        query="What happened during the previous payment-api incident?",
    )

    print("\nRecalled memories:")

    if not result.results:
        print("No memories were returned.")
    else:
        for memory in result.results:
            print("-", memory.text)

    client.close()

    print("\nHindsight test completed successfully.")


if __name__ == "__main__":
    main()