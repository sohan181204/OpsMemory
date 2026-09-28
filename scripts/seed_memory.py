from backend.app.services.hindsight_service import HindsightService


def main() -> None:
    """Seed one canonical historical incident into Hindsight."""

    hindsight = HindsightService()

    memory = """
Historical Incident: INC-001

Service:
payment-api

Environment:
production

Severity:
SEV-1

Deployment Version:
v2.4.1

Symptoms:
HTTP 500 errors increased immediately after deployment.

Probable Cause:
A regression or configuration issue introduced by deployment v2.4.1.

Resolution:
Rolled back payment-api from v2.4.1 to the previous stable version v2.4.0.

Outcome:
The incident was resolved after the rollback.

Lesson:
When payment-api experiences a sudden HTTP 5xx spike immediately after
a deployment, investigate the recent release and compare it with the
previous stable version. A rollback may be considered when the release
is strongly associated with the failure.

Operational Learning:
This incident should be considered when future payment-api incidents
show similar symptoms after a deployment.
""".strip()

    print("🧠 Retaining canonical incident memory...")
    hindsight.retain(memory)
    print("✅ Canonical incident memory retained successfully.")

    hindsight.close()
    print("✅ Hindsight client closed.")


if __name__ == "__main__":
    main()
    