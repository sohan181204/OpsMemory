from datetime import datetime, timezone

from backend.app.db.database import SessionLocal, init_db
from backend.app.db.models import (
    IncidentAnalysisModel,
    IncidentModel,
    IncidentPostmortemModel,
)


DEMO_INCIDENTS = [
    {
        "id": "8ade7fdc-7495-4719-bb91-e279cbb427ce",
        "created_at": datetime(
            2026,
            9,
            27,
            21,
            46,
            13,
            tzinfo=timezone.utc,
        ),
        "service": "payment-api",
        "environment": "production",
        "severity": "SEV-1",
        "title": "Payment API 5xx spike after deployment",
        "description": (
            "HTTP 500 responses increased sharply immediately "
            "after deployment v3.2.0. Customers are experiencing "
            "failed payments. The service was healthy before the "
            "deployment."
        ),
        "deployment_version": "v3.2.0",
        "status": "RESOLVED",
        "resolution": (
            "Rolled back payment-api from v3.2.0 to the previous "
            "stable version after confirming the HTTP 500 spike "
            "was associated with the deployment. Error rates "
            "returned toward normal after the rollback."
        ),
        "analysis": {
            "summary": (
                "The payment-api service in production experienced "
                "a sharp increase in HTTP 500 responses immediately "
                "after deployment v3.2.0."
            ),
            "probable_cause": (
                "A regression or configuration issue introduced "
                "by deployment v3.2.0 is the likely cause based "
                "on the observed timing and symptoms."
            ),
            "recommended_action": (
                "Compare the v3.2.0 release with the previous stable "
                "version, inspect the relevant logs and configuration, "
                "and consider rollback if the release is confirmed "
                "as the source of the regression."
            ),
        },
        "postmortem": {
            "probable_cause": (
                "A regression or configuration issue introduced "
                "by deployment v3.2.0 caused the payment-api "
                "HTTP 500 spike."
            ),
            "resolution": (
                "Rolled back payment-api from v3.2.0 to the previous "
                "stable version after confirming the HTTP 500 spike "
                "was associated with the deployment."
            ),
            "lesson": (
                "When payment-api experiences a sudden HTTP 5xx "
                "spike immediately after deployment, investigate "
                "the release change against the previous stable "
                "deployment and use confirmed incident outcomes "
                "to guide remediation."
            ),
        },
    },
    {
        "id": "ed80262d-f7c7-4e76-b86f-eea53804ae06",
        "created_at": datetime(
            2026,
            9,
            28,
            10,
            35,
            46,
            tzinfo=timezone.utc,
        ),
        "service": "payment-api",
        "environment": "production",
        "severity": "SEV-2",
        "title": "Payment API 5xx spike after v3.3.0 deployment",
        "description": (
            "HTTP 500 responses increased sharply immediately "
            "after deployment v3.3.0. Customers are experiencing "
            "failed payments. The service was healthy before the "
            "deployment."
        ),
        "deployment_version": "v3.3.0",
        "status": "RESOLVED",
        "resolution": (
            "Rolled back payment-api from v3.3.0 to the previous "
            "stable version after confirming the HTTP 500 spike "
            "was associated with the deployment. Error rates "
            "returned toward normal after the rollback."
        ),
        "analysis": {
            "summary": (
                "The payment-api service in production experienced "
                "a sharp increase in HTTP 500 responses immediately "
                "after deployment v3.3.0."
            ),
            "probable_cause": (
                "Historical evidence from the v3.2.0 incident "
                "suggests that a regression or configuration issue "
                "introduced by v3.3.0 is the likely cause."
            ),
            "recommended_action": (
                "Compare v3.3.0 with the last known good version, "
                "inspect logs and release configuration, and "
                "consider a controlled rollback if the regression "
                "is confirmed."
            ),
        },
        "postmortem": {
            "probable_cause": (
                "A regression or configuration issue introduced "
                "by deployment v3.3.0 caused the payment-api "
                "HTTP 500 spike."
            ),
            "resolution": (
                "Rolled back payment-api from v3.3.0 to the previous "
                "stable version after confirming the HTTP 500 spike "
                "was associated with the deployment."
            ),
            "lesson": (
                "When payment-api experiences a sudden HTTP 5xx "
                "spike immediately after deployment, investigate "
                "the release change against the previous stable "
                "deployment and consider rollback based on "
                "confirmed evidence."
            ),
        },
    },
    {
        "id": "d3fd31d6-5c92-47c7-9650-151fe49ef140",
        "created_at": datetime(
            2026,
            9,
            28,
            11,
            14,
            17,
            tzinfo=timezone.utc,
        ),
        "service": "payment-api",
        "environment": "production",
        "severity": "SEV-2",
        "title": "Payment API 5xx spike after v3.4.0 deployment",
        "description": (
            "HTTP 500 responses increased sharply immediately "
            "after deployment v3.4.0. Customers are experiencing "
            "failed payments. The service was healthy before the "
            "deployment."
        ),
        "deployment_version": "v3.4.0",
        "status": "RESOLVED",
        "resolution": (
            "Rolled back payment-api from v3.4.0 to the previous "
            "stable version after confirming the HTTP 500 spike "
            "was associated with the deployment. Error rates "
            "returned toward normal after the rollback."
        ),
        "analysis": {
            "summary": (
                "The payment-api service in production experienced "
                "a sharp increase in HTTP 500 responses immediately "
                "after deployment v3.4.0."
            ),
            "probable_cause": (
                "Historical incidents involving v3.2.0 and v3.3.0 "
                "show a repeated deployment-to-5xx pattern. "
                "The evidence suggests that v3.4.0 may contain "
                "a similar regression or configuration issue."
            ),
            "recommended_action": (
                "Review v3.4.0 code, configuration, and database "
                "changes against the previous stable release. "
                "Correlate the new errors with the deployment and "
                "consider rollback if the release is confirmed."
            ),
        },
        "postmortem": {
            "probable_cause": (
                "A regression or configuration issue introduced "
                "by deployment v3.4.0 caused the payment-api "
                "HTTP 500 spike."
            ),
            "resolution": (
                "Rolled back payment-api from v3.4.0 to the previous "
                "stable version after confirming the HTTP 500 spike "
                "was associated with the deployment."
            ),
            "lesson": (
                "When payment-api experiences a sudden HTTP 5xx "
                "spike immediately after deployment, investigate "
                "the release change against previous stable "
                "deployments and use confirmed incident outcomes "
                "to guide remediation."
            ),
        },
    },
]


def seed_incident(
    session,
    incident_data: dict,
) -> None:
    """Insert one demo incident and its associated records."""

    incident_id = incident_data["id"]

    existing = session.get(
        IncidentModel,
        incident_id,
    )

    if existing is not None:
        print(
            f"⏭️  Incident already exists: "
            f"{incident_data['deployment_version']}"
        )
        return

    incident = IncidentModel(
        id=incident_id,
        service=incident_data["service"],
        environment=incident_data["environment"],
        severity=incident_data["severity"],
        title=incident_data["title"],
        description=incident_data["description"],
        deployment_version=incident_data[
            "deployment_version"
        ],
        status=incident_data["status"],
        resolution=incident_data["resolution"],
        created_at=incident_data["created_at"],
    )

    session.add(incident)

    analysis_data = incident_data["analysis"]

    analysis = IncidentAnalysisModel(
        incident_id=incident_id,
        summary=analysis_data["summary"],
        probable_cause=analysis_data["probable_cause"],
        recommended_action=analysis_data[
            "recommended_action"
        ],
        created_at=incident_data["created_at"],
    )

    session.add(analysis)

    postmortem_data = incident_data["postmortem"]

    postmortem = IncidentPostmortemModel(
        incident_id=incident_id,
        probable_cause=postmortem_data[
            "probable_cause"
        ],
        resolution=postmortem_data["resolution"],
        lesson=postmortem_data["lesson"],
        memory_retained=True,
        created_at=incident_data["created_at"],
    )

    session.add(postmortem)

    print(
        f"✅ Seeded "
        f"{incident_data['deployment_version']} "
        f"incident."
    )


def main() -> None:
    """Create the canonical OpsMemory demo database."""

    print("🗄️  Initializing OpsMemory database...")

    init_db()

    with SessionLocal() as session:
        for incident_data in DEMO_INCIDENTS:
            seed_incident(
                session,
                incident_data,
            )

        session.commit()

    print(
        "\n✅ Demo database is ready with "
        "v3.2.0, v3.3.0, and v3.4.0."
    )


if __name__ == "__main__":
    main()