from datetime import datetime, timezone
from uuid import UUID, uuid4

from backend.app.db.database import SessionLocal, init_db
from backend.app.db.models import (
    IncidentAnalysisModel,
    IncidentModel,
    IncidentPostmortemModel,
)
from backend.app.schemas.incident import (
    IncidentAnalysisDetails,
    IncidentAnalysisResponse,
    IncidentCreate,
    IncidentDetailsResponse,
    IncidentMemory,
    IncidentPostmortem,
    IncidentPostmortemDetails,
    IncidentPostmortemResponse,
    IncidentResolve,
    IncidentResponse,
)
from backend.app.services.hindsight_service import HindsightService
from backend.app.services.llm_service import LLMService


class IncidentService:
    """Business logic for persistent incidents and memory-powered analysis."""

    def __init__(self) -> None:
        """Initialize the database and external services."""

        init_db()

        self.hindsight = HindsightService()
        self.llm = LLMService()

    # ------------------------------------------------------------------
    # Response conversion
    # ------------------------------------------------------------------

    @staticmethod
    def _to_response(
        incident: IncidentModel,
    ) -> IncidentResponse:
        """Convert a database incident into the API response model."""

        created_at = incident.created_at

        if created_at.tzinfo is None:
            created_at = created_at.replace(
                tzinfo=timezone.utc
            )

        return IncidentResponse(
            id=UUID(incident.id),
            service=incident.service,
            environment=incident.environment,
            severity=incident.severity,
            title=incident.title,
            description=incident.description,
            deployment_version=incident.deployment_version,
            status=incident.status,
            created_at=created_at,
        )

    # ------------------------------------------------------------------
    # Hindsight memory filtering
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_memory_source_id(
        memory_text: str,
    ) -> UUID | None:
        """
        Extract the source incident UUID from newly formatted
        OpsMemory postmortem records.
        """

        import re

        match = re.search(
            r"source incident id:\s*([0-9a-fA-F-]{36})",
            memory_text,
            flags=re.IGNORECASE,
        )

        if match is None:
            return None

        try:
            return UUID(match.group(1))
        except ValueError:
            return None

    @staticmethod
    def _extract_memory_deployment(
        memory_text: str,
    ) -> str | None:
        """
        Extract a deployment version from legacy Hindsight memories.

        This supports memories created before Source Incident ID
        metadata was introduced.
        """

        import re

        patterns = [
            r"deployment version:\s*(v[0-9A-Za-z._-]+)",
            r"deployment of version\s+(v[0-9A-Za-z._-]+)",
            r"deployment\s+(v[0-9A-Za-z._-]+)",
        ]

        for pattern in patterns:
            match = re.search(
                pattern,
                memory_text,
                flags=re.IGNORECASE,
            )

            if match:
                return match.group(1).strip().lower()

        return None

    def _find_memory_source_incident(
        self,
        memory_text: str,
    ) -> IncidentResponse | None:
        """
        Resolve a Hindsight memory back to a local incident.

        New records use Source Incident ID.
        Legacy records use service + deployment version.
        """

        source_id = self._extract_memory_source_id(
            memory_text
        )

        # --------------------------------------------------------------
        # New memory format: exact incident UUID.
        # --------------------------------------------------------------

        if source_id is not None:
            return self.get_incident(source_id)

        # --------------------------------------------------------------
        # Legacy memory format: infer source from deployment version.
        # --------------------------------------------------------------

        deployment = self._extract_memory_deployment(
            memory_text
        )

        if deployment is None:
            return None

        text = " ".join(
            memory_text.split()
        ).lower()

        with SessionLocal() as session:
            incidents = (
                session.query(IncidentModel)
                .order_by(
                    IncidentModel.created_at.desc()
                )
                .all()
            )

            candidates: list[IncidentModel] = []

            for incident in incidents:
                incident_deployment = (
                    incident.deployment_version or ""
                ).strip().lower()

                if incident_deployment != deployment:
                    continue

                service = incident.service.strip().lower()

                if service and service not in text:
                    continue

                candidates.append(incident)

            if not candidates:
                return None

            # Most recently created incident using this deployment
            # is the best legacy-source match.
            return self._to_response(
                candidates[0]
            )

    def _recall_historical_memories(
        self,
        incident: IncidentResponse,
    ) -> list[dict]:
        """
        Recall Hindsight memories and keep only memories whose source
        incident occurred before the incident currently being analyzed.

        Only one memory is kept per historical source incident.

        Unknown-source memories are excluded because they cannot be
        safely placed in the incident timeline.
        """

        query = (
            f"service={incident.service} "
            f"environment={incident.environment} "
            f"severity={incident.severity} "
            f"title={incident.title} "
            f"description={incident.description} "
            f"deployment={incident.deployment_version or 'unknown'}"
        )

        recalled = self.hindsight.recall(query)

        unique_memories: list[dict] = []
        seen_source_incidents: set[UUID] = set()

        for memory in recalled:
            text = memory["text"].strip()

            if not text:
                continue

            # ----------------------------------------------------------
            # Resolve the memory back to its source incident.
            # ----------------------------------------------------------

            source_incident = self._find_memory_source_incident(
                text
            )

            # We only trust memories whose source can be identified.
            if source_incident is None:
                continue

            # ----------------------------------------------------------
            # Chronological rule:
            #
            # The source incident must be older than the
            # incident currently being analyzed.
            # ----------------------------------------------------------

            if source_incident.created_at >= incident.created_at:
                continue

            # ----------------------------------------------------------
            # Incident-level deduplication:
            #
            # Hindsight may return multiple memories describing
            # the same historical incident. Keep only one.
            # ----------------------------------------------------------

            source_id = source_incident.id

            if source_id in seen_source_incidents:
                continue

            seen_source_incidents.add(source_id)

            unique_memories.append(
                {
                    "text": text,
                    "score": memory.get("score"),
                }
            )

            # Limit the amount of historical context.
            if len(unique_memories) >= 5:
                break

        return unique_memories

    # ------------------------------------------------------------------
    # Create incident
    # ------------------------------------------------------------------

    def create_incident(
        self,
        incident_data: IncidentCreate,
    ) -> IncidentResponse:
        """Create and persist a new incident."""

        incident_id = uuid4()
        created_at = datetime.now(timezone.utc)

        incident = IncidentModel(
            id=str(incident_id),
            service=incident_data.service,
            environment=incident_data.environment,
            severity=incident_data.severity,
            title=incident_data.title,
            description=incident_data.description,
            deployment_version=incident_data.deployment_version,
            status="OPEN",
            resolution=None,
            created_at=created_at,
        )

        with SessionLocal() as session:
            session.add(incident)
            session.commit()
            session.refresh(incident)

            return self._to_response(incident)

    # ------------------------------------------------------------------
    # Get incident
    # ------------------------------------------------------------------

    def get_incident(
        self,
        incident_id: UUID,
    ) -> IncidentResponse | None:
        """Retrieve an incident from the database."""

        with SessionLocal() as session:
            incident = session.get(
                IncidentModel,
                str(incident_id),
            )

            if incident is None:
                return None

            return self._to_response(incident)

    # ------------------------------------------------------------------
    # List incidents
    # ------------------------------------------------------------------

    def list_incidents(self) -> list[IncidentResponse]:
        """Return all incidents from the database."""

        with SessionLocal() as session:
            incidents = (
                session.query(IncidentModel)
                .order_by(IncidentModel.created_at.desc())
                .all()
            )

            return [
                self._to_response(incident)
                for incident in incidents
            ]

    # ------------------------------------------------------------------
    # Analyze incident
    # ------------------------------------------------------------------

    def analyze_incident(
        self,
        incident_id: UUID,
    ) -> IncidentAnalysisResponse | None:
        """Analyze an incident using historical Hindsight memory and LLM."""

        incident = self.get_incident(incident_id)

        if incident is None:
            return None

        # --------------------------------------------------------------
        # 1. Recall historical Hindsight knowledge.
        # --------------------------------------------------------------

        unique_memories = self._recall_historical_memories(
            incident
        )

        memories = [
            IncidentMemory(
                text=memory["text"],
                score=memory["score"],
            )
            for memory in unique_memories
        ]

        # --------------------------------------------------------------
        # 2. Prepare incident data for the LLM.
        # --------------------------------------------------------------

        incident_data = {
            "id": str(incident.id),
            "service": incident.service,
            "environment": incident.environment,
            "severity": incident.severity,
            "title": incident.title,
            "description": incident.description,
            "deployment_version": incident.deployment_version,
            "created_at": incident.created_at.isoformat(),
        }

        # --------------------------------------------------------------
        # 3. Generate AI analysis.
        # --------------------------------------------------------------

        llm_result = self.llm.analyze_incident(
            incident=incident_data,
            memories=unique_memories,
        )

        # --------------------------------------------------------------
        # 4. Persist AI analysis.
        # --------------------------------------------------------------

        analysis_created_at = datetime.now(timezone.utc)

        with SessionLocal() as session:
            existing_analysis = (
                session.query(IncidentAnalysisModel)
                .filter(
                    IncidentAnalysisModel.incident_id
                    == str(incident.id)
                )
                .first()
            )

            if existing_analysis is None:
                analysis_record = IncidentAnalysisModel(
                    incident_id=str(incident.id),
                    summary=llm_result["summary"],
                    probable_cause=llm_result["probable_cause"],
                    recommended_action=llm_result[
                        "recommended_action"
                    ],
                    created_at=analysis_created_at,
                )

                session.add(analysis_record)

            else:
                existing_analysis.summary = (
                    llm_result["summary"]
                )

                existing_analysis.probable_cause = (
                    llm_result["probable_cause"]
                )

                existing_analysis.recommended_action = (
                    llm_result["recommended_action"]
                )

                existing_analysis.created_at = (
                    analysis_created_at
                )

            session.commit()

        # --------------------------------------------------------------
        # 5. Return analysis + memory evidence.
        # --------------------------------------------------------------

        return IncidentAnalysisResponse(
            incident_id=incident.id,
            status="ANALYZED",
            summary=llm_result["summary"],
            probable_cause=llm_result["probable_cause"],
            recommended_action=llm_result[
                "recommended_action"
            ],
            memories=memories,
        )

    # ------------------------------------------------------------------
    # Resolve incident
    # ------------------------------------------------------------------

    def resolve_incident(
        self,
        incident_id: UUID,
        resolution_data: IncidentResolve,
    ) -> IncidentResponse | None:
        """Mark an incident as resolved and persist the resolution."""

        with SessionLocal() as session:
            incident = session.get(
                IncidentModel,
                str(incident_id),
            )

            if incident is None:
                return None

            incident.status = "RESOLVED"
            incident.resolution = resolution_data.resolution

            session.commit()
            session.refresh(incident)

            return self._to_response(incident)

    # ------------------------------------------------------------------
    # Create postmortem + retain learning
    # ------------------------------------------------------------------

    def create_postmortem(
        self,
        incident_id: UUID,
        postmortem: IncidentPostmortem,
    ) -> IncidentPostmortemResponse | None:
        """
        Create a postmortem locally and retain the confirmed learning
        in Hindsight.
        """

        with SessionLocal() as session:
            incident = session.get(
                IncidentModel,
                str(incident_id),
            )

            if incident is None:
                return None

            # ----------------------------------------------------------
            # Incident must be resolved before learning.
            # ----------------------------------------------------------

            if incident.status != "RESOLVED":
                raise ValueError(
                    "Incident must be resolved before creating a postmortem."
                )

            resolution = (
                incident.resolution
                or postmortem.resolution
            )

            # ----------------------------------------------------------
            # Prevent duplicate Hindsight retention.
            # ----------------------------------------------------------

            existing_postmortem = (
                session.query(IncidentPostmortemModel)
                .filter(
                    IncidentPostmortemModel.incident_id
                    == str(incident_id)
                )
                .first()
            )

            if (
                existing_postmortem is not None
                and existing_postmortem.memory_retained
            ):
                return IncidentPostmortemResponse(
                    incident_id=incident_id,
                    status="MEMORY_RETAINED",
                    memory_retained=True,
                    message=(
                        "This incident has already been retained "
                        "in Hindsight."
                    ),
                )

            # ----------------------------------------------------------
            # Build long-term Hindsight memory.
            # ----------------------------------------------------------

            memory_content = f"""
OpsMemory Memory Record

Record Type:
INCIDENT_POSTMORTEM

Source Incident ID:
{incident_id}

Service:
{incident.service}

Environment:
{incident.environment}

Severity:
{incident.severity}

Incident Title:
{incident.title}

Incident Description:
{incident.description}

Deployment Version:
{incident.deployment_version or "unknown"}

Probable Cause:
{postmortem.probable_cause}

Resolution:
{resolution}

Lesson:
{postmortem.lesson}

Operational Learning:
Future incidents with similar symptoms should consider this
incident history during investigation and remediation.
""".strip()

            # ----------------------------------------------------------
            # Persist postmortem locally first.
            # ----------------------------------------------------------

            postmortem_created_at = datetime.now(timezone.utc)

            if existing_postmortem is None:
                postmortem_record = IncidentPostmortemModel(
                    incident_id=str(incident_id),
                    probable_cause=postmortem.probable_cause,
                    resolution=resolution,
                    lesson=postmortem.lesson,
                    memory_retained=False,
                    created_at=postmortem_created_at,
                )

                session.add(postmortem_record)

            else:
                existing_postmortem.probable_cause = (
                    postmortem.probable_cause
                )

                existing_postmortem.resolution = resolution

                existing_postmortem.lesson = (
                    postmortem.lesson
                )

                existing_postmortem.memory_retained = False

                existing_postmortem.created_at = (
                    postmortem_created_at
                )

            session.commit()

            # ----------------------------------------------------------
            # Retain only the confirmed postmortem in Hindsight.
            # ----------------------------------------------------------

            self.hindsight.retain(memory_content)

            # ----------------------------------------------------------
            # Mark local postmortem as successfully retained.
            # ----------------------------------------------------------

            if existing_postmortem is None:
                saved_postmortem = (
                    session.query(
                        IncidentPostmortemModel
                    )
                    .filter(
                        IncidentPostmortemModel.incident_id
                        == str(incident_id)
                    )
                    .first()
                )
            else:
                saved_postmortem = existing_postmortem

            if saved_postmortem is not None:
                saved_postmortem.memory_retained = True
                session.commit()

            return IncidentPostmortemResponse(
                incident_id=incident_id,
                status="MEMORY_RETAINED",
                memory_retained=True,
                message=(
                    "Postmortem successfully retained in Hindsight "
                    "and persisted locally for future incident analysis."
                ),
            )

    # ------------------------------------------------------------------
    # Incident details
    # ------------------------------------------------------------------

    def get_incident_details(
        self,
        incident_id: UUID,
    ) -> IncidentDetailsResponse | None:
        """
        Return complete incident state including AI analysis,
        resolution, postmortem, and historical Hindsight memories.
        """

        # --------------------------------------------------------------
        # 1. Load SQLite state.
        # --------------------------------------------------------------

        with SessionLocal() as session:
            incident = session.get(
                IncidentModel,
                str(incident_id),
            )

            if incident is None:
                return None

            analysis = (
                session.query(IncidentAnalysisModel)
                .filter(
                    IncidentAnalysisModel.incident_id
                    == str(incident_id)
                )
                .first()
            )

            postmortem = (
                session.query(IncidentPostmortemModel)
                .filter(
                    IncidentPostmortemModel.incident_id
                    == str(incident_id)
                )
                .first()
            )

            incident_response = self._to_response(
                incident
            )

            resolution = incident.resolution

            # ----------------------------------------------------------
            # Convert analysis.
            # ----------------------------------------------------------

            analysis_response = None

            if analysis is not None:
                analysis_created_at = analysis.created_at

                if analysis_created_at.tzinfo is None:
                    analysis_created_at = (
                        analysis_created_at.replace(
                            tzinfo=timezone.utc
                        )
                    )

                analysis_response = IncidentAnalysisDetails(
                    summary=analysis.summary,
                    probable_cause=analysis.probable_cause,
                    recommended_action=(
                        analysis.recommended_action
                    ),
                    created_at=analysis_created_at,
                )

            # ----------------------------------------------------------
            # Convert postmortem.
            # ----------------------------------------------------------

            postmortem_response = None

            if postmortem is not None:
                postmortem_created_at = (
                    postmortem.created_at
                )

                if postmortem_created_at.tzinfo is None:
                    postmortem_created_at = (
                        postmortem_created_at.replace(
                            tzinfo=timezone.utc
                        )
                    )

                postmortem_response = (
                    IncidentPostmortemDetails(
                        probable_cause=(
                            postmortem.probable_cause
                        ),
                        resolution=postmortem.resolution,
                        lesson=postmortem.lesson,
                        memory_retained=(
                            postmortem.memory_retained
                        ),
                        created_at=postmortem_created_at,
                    )
                )

        # --------------------------------------------------------------
        # 2. Recall historical Hindsight memories.
        # --------------------------------------------------------------

        unique_memories = self._recall_historical_memories(
            incident_response
        )

        memories = [
            IncidentMemory(
                text=memory["text"],
                score=memory["score"],
            )
            for memory in unique_memories
        ]

        # --------------------------------------------------------------
        # 3. Return complete incident state.
        # --------------------------------------------------------------

        return IncidentDetailsResponse(
            incident=incident_response,
            resolution=resolution,
            analysis=analysis_response,
            postmortem=postmortem_response,
            memories=memories,
        )

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------

    def close(self) -> None:
        """Close external service clients."""

        self.hindsight.close()