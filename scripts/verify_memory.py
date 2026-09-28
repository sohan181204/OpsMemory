from backend.app.services.incident_service import IncidentService


def print_memory_results(
    service: IncidentService,
    deployment: str,
) -> None:
    """Verify chronological Hindsight recall for one demo incident."""

    incidents = service.list_incidents()

    target = next(
        (
            incident
            for incident in incidents
            if incident.deployment_version == deployment
        ),
        None,
    )

    if target is None:
        print(
            f"❌ Could not find demo incident {deployment}."
        )
        return

    print("=" * 72)
    print(f"🔎 Verifying memory timeline for {deployment}")
    print(f"Incident ID: {target.id}")
    print(f"Created: {target.created_at.isoformat()}")
    print("=" * 72)

    memories = service._recall_historical_memories(target)

    if not memories:
        print("No eligible historical memories found.\n")
        return

    print(
        f"✅ {len(memories)} historical memory result(s) accepted.\n"
    )

    for index, memory in enumerate(
        memories,
        start=1,
    ):
        source = service._find_memory_source_incident(
            memory["text"]
        )

        print(f"--- Historical Memory {index} ---")
        print(f"Score: {memory.get('score')}")

        if source is not None:
            print(
                f"Source incident: "
                f"{source.deployment_version}"
            )
            print(
                f"Source created: "
                f"{source.created_at.isoformat()}"
            )

            if source.created_at < target.created_at:
                print("Timeline check: ✅ older than current incident")
            else:
                print("Timeline check: ❌ INVALID")

        print(memory["text"])
        print()


def main() -> None:
    """Verify the OpsMemory chronological learning timeline."""

    service = IncidentService()

    try:
        print("\n🧠 OpsMemory chronological memory verification\n")

        print_memory_results(service, "v3.2.0")
        print_memory_results(service, "v3.3.0")
        print_memory_results(service, "v3.4.0")

        print("=" * 72)
        print("✅ Chronological memory verification complete.")
        print("=" * 72)

    finally:
        service.close()


if __name__ == "__main__":
    main()