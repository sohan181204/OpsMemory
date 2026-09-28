from backend.app.services.incident_service import IncidentService


EXPECTED_MEMORY_PROGRESSION = {
    "v3.2.0": set(),
    "v3.3.0": {"v3.2.0"},
    "v3.4.0": {"v3.2.0", "v3.3.0"},
}


def verify_incident(
    service: IncidentService,
    deployment_version: str,
) -> None:
    incidents = service.list_incidents()

    target = next(
        (
            incident
            for incident in incidents
            if incident.deployment_version == deployment_version
        ),
        None,
    )

    if target is None:
        raise RuntimeError(
            f"Incident {deployment_version} was not found."
        )

    memories = service._recall_historical_memories(target)

    actual_versions: set[str] = set()

    for memory in memories:
        source_incident = (
            service._find_memory_source_incident(
                memory["text"],
            )
        )

        if source_incident is None:
            continue

        if source_incident.deployment_version:
            actual_versions.add(
                source_incident.deployment_version,
            )

    expected_versions = EXPECTED_MEMORY_PROGRESSION[
        deployment_version
    ]

    assert actual_versions == expected_versions, (
        f"{deployment_version}: expected "
        f"{expected_versions}, got {actual_versions}"
    )

    assert len(actual_versions) == len(memories), (
        f"{deployment_version}: duplicate historical incidents "
        "were returned."
    )

    print(
        f"{deployment_version}: "
        f"{len(memories)} unique historical memories -> "
        f"{sorted(actual_versions)}"
    )


def main() -> None:
    service = IncidentService()

    try:
        for deployment_version in (
            "v3.2.0",
            "v3.3.0",
            "v3.4.0",
        ):
            verify_incident(
                service,
                deployment_version,
            )

        print()
        print("Hindsight memory progression verified successfully.")
        print("Expected: v3.2.0 -> 0, v3.3.0 -> 1, v3.4.0 -> 2")

    finally:
        service.hindsight.close()


if __name__ == "__main__":
    main()