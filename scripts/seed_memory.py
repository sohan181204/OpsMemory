from backend.app.services.hindsight_service import HindsightService


MEMORIES = [
    {
        "source_incident_id": "8ade7fdc-7495-4719-bb91-e279cbb427ce",
        "deployment": "v3.2.0",
        "content": """
OpsMemory Memory Record

Record Type:
INCIDENT_POSTMORTEM

Source Incident ID:
8ade7fdc-7495-4719-bb91-e279cbb427ce

Service:
payment-api

Environment:
production

Severity:
SEV-1

Incident Title:
Payment API 5xx spike after deployment

Incident Description:
HTTP 500 responses increased sharply immediately after deployment
v3.2.0. Customers experienced failed payments. The service was
healthy before the deployment.

Deployment Version:
v3.2.0

Probable Cause:
A regression or configuration issue introduced by deployment v3.2.0.

Resolution:
Rolled back payment-api to the previous stable version after
confirming the HTTP 500 spike was associated with the deployment.

Lesson:
When payment-api experiences a sudden HTTP 5xx spike immediately
after deployment, investigate the release change against the
previous stable deployment and use confirmed incident outcomes
to guide remediation.

Operational Learning:
This confirmed incident experience should be considered when future
payment-api incidents show similar symptoms after a deployment.
""".strip(),
    },
    {
        "source_incident_id": "ed80262d-f7c7-4e76-b86f-eea53804ae06",
        "deployment": "v3.3.0",
        "content": """
OpsMemory Memory Record

Record Type:
INCIDENT_POSTMORTEM

Source Incident ID:
ed80262d-f7c7-4e76-b86f-eea53804ae06

Service:
payment-api

Environment:
production

Severity:
SEV-2

Incident Title:
Payment API 5xx spike after v3.3.0 deployment

Incident Description:
HTTP 500 responses increased sharply immediately after deployment
v3.3.0. Customers experienced failed payments. The service was
healthy before the deployment.

Deployment Version:
v3.3.0

Probable Cause:
A regression or configuration issue introduced by deployment v3.3.0.

Resolution:
Rolled back payment-api from v3.3.0 to the previous stable version
after confirming the HTTP 500 spike was associated with the deployment.

Lesson:
When payment-api experiences a sudden HTTP 5xx spike immediately
after a deployment, investigate the release change against the
previous stable deployment and consider rollback based on confirmed
evidence.

Operational Learning:
This confirmed incident experience should be considered when future
payment-api incidents show similar symptoms after a deployment.
""".strip(),
    },
    {
        "source_incident_id": "d3fd31d6-5c92-47c7-9650-151fe49ef140",
        "deployment": "v3.4.0",
        "content": """
OpsMemory Memory Record

Record Type:
INCIDENT_POSTMORTEM

Source Incident ID:
d3fd31d6-5c92-47c7-9650-151fe49ef140

Service:
payment-api

Environment:
production

Severity:
SEV-2

Incident Title:
Payment API 5xx spike after v3.4.0 deployment

Incident Description:
HTTP 500 responses increased sharply immediately after deployment
v3.4.0. Customers experienced failed payments. The service was
healthy before the deployment.

Deployment Version:
v3.4.0

Probable Cause:
A regression or configuration issue introduced by deployment v3.4.0.

Resolution:
Rolled back payment-api from v3.4.0 to the previous stable version
after confirming the HTTP 500 spike was associated with the deployment.

Lesson:
When payment-api experiences a sudden HTTP 5xx spike immediately
after deployment, investigate the release change against previous
stable deployments and use confirmed incident outcomes to guide
remediation.

Operational Learning:
This confirmed incident experience should be considered when future
payment-api incidents show similar symptoms after a deployment.
""".strip(),
    },
]


def main() -> None:
    """Seed the canonical OpsMemory demonstration memories."""

    hindsight = HindsightService()

    try:
        for index, memory in enumerate(MEMORIES, start=1):
            print(
                f"🧠 Retaining demo memory {index}/"
                f"{len(MEMORIES)} "
                f"({memory['deployment']})..."
            )

            hindsight.retain(memory["content"])

            print(
                f"✅ {memory['deployment']} memory retained."
            )

        print("\n✅ Demo Hindsight memories seeded successfully.")

    finally:
        hindsight.close()
        print("✅ Hindsight client closed.")


if __name__ == "__main__":
    main()