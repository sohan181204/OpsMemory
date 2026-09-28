from backend.app.schemas.incident import IncidentCreate
from backend.app.services.incident_service import IncidentService


def main() -> None:
    service = IncidentService()

    incident_data = IncidentCreate(
        service="payment-api",
        environment="production",
        severity="SEV-1",
        title="Payment API 5xx spike",
        description=(
            "HTTP 500 errors increased immediately after deployment."
        ),
        deployment_version="v2.5.0",
    )

    incident = service.create_incident(incident_data)

    print("✅ Incident created")
    print(f"ID: {incident.id}")
    print(f"Service: {incident.service}")
    print(f"Severity: {incident.severity}")
    print(f"Status: {incident.status}")

    fetched = service.get_incident(incident.id)

    assert fetched is not None
    assert fetched.id == incident.id

    print("✅ Incident retrieved successfully")

    incidents = service.list_incidents()

    assert len(incidents) == 1

    print("✅ Incident list works")
    print(f"Total incidents: {len(incidents)}")


if __name__ == "__main__":
    main()