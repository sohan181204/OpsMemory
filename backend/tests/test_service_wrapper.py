from backend.app.services.hindsight_service import HindsightService


def main() -> None:
    service = HindsightService()

    try:
        print("✅ HindsightService initialized")
        print(f"Bank: {service.bank_id}")

        service.retain(
            "OpsMemory wrapper test: "
            "payment-api experienced HTTP 500 errors after deployment. "
            "Rollback resolved the incident."
        )

        print("✅ Memory retained successfully")

        memories = service.recall(
            "payment-api HTTP 500 deployment rollback"
        )

        print("✅ Memory recalled successfully")
        print()
        print("Recalled memories:")

        for memory in memories:
            print("-", memory)

    finally:
        service.close()
        print("✅ Hindsight client closed")


if __name__ == "__main__":
    main()