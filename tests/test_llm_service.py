from backend.app.services.llm_service import LLMService


def main() -> None:
    service = LLMService()

    incident = {
        "service": "payment-api",
        "environment": "production",
        "severity": "SEV-1",
        "title": "Payment API 5xx spike after deployment",
        "description": (
            "HTTP 500 errors increased immediately after deployment v2.5.0"
        ),
        "deployment_version": "v2.5.0",
    }

    memories = [
        {
            "text": (
                "Incident INC-001 involved elevated HTTP 500 errors "
                "in payment-api following deployment v2.4.1 and was "
                "resolved by rolling back to v2.4.0."
            ),
            "score": 1.09,
        }
    ]

    result = service.analyze_incident(
        incident=incident,
        memories=memories,
    )

    print("✅ LLM analysis completed")
    print()
    print("SUMMARY:")
    print(result["summary"])
    print()
    print("PROBABLE CAUSE:")
    print(result["probable_cause"])
    print()
    print("RECOMMENDED ACTION:")
    print(result["recommended_action"])


if __name__ == "__main__":
    main()
    