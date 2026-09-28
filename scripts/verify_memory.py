from backend.app.services.hindsight_service import HindsightService


def main() -> None:
    """Verify that the canonical incident can be recalled."""

    hindsight = HindsightService()

    query = """
    payment-api production HTTP 500 errors after deployment
    rollback previous stable version
    """.strip()

    print("🔎 Recalling historical incident memory...\n")

    memories = hindsight.recall(query)

    for index, memory in enumerate(memories[:5], start=1):
        print(f"--- Memory {index} ---")
        print(f"Score: {memory.get('score')}")
        print(memory["text"])
        print()

    hindsight.close()


if __name__ == "__main__":
    main()
    