from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.schemas.incident import (
    IncidentAnalysisResponse,
    IncidentCreate,
    IncidentDetailsResponse,
    IncidentPostmortem,
    IncidentPostmortemResponse,
    IncidentResolve,
    IncidentResponse,
)
from backend.app.security import require_api_key
from backend.app.services.incident_service import IncidentService


router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"],
    dependencies=[Depends(require_api_key)],
)

incident_service = IncidentService()


# ----------------------------------------------------------------------
# Create incident
# ----------------------------------------------------------------------

@router.post(
    "/",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident(
    incident_data: IncidentCreate,
) -> IncidentResponse:
    """Create a new incident."""

    return incident_service.create_incident(
        incident_data,
    )


# ----------------------------------------------------------------------
# List incidents
# ----------------------------------------------------------------------

@router.get(
    "/",
    response_model=list[IncidentResponse],
)
def list_incidents() -> list[IncidentResponse]:
    """Return all incidents."""

    return incident_service.list_incidents()


# ----------------------------------------------------------------------
# Incident details
# IMPORTANT: this must appear before /{incident_id}
# ----------------------------------------------------------------------

@router.get(
    "/{incident_id}/details",
    response_model=IncidentDetailsResponse,
)
def get_incident_details(
    incident_id: UUID,
) -> IncidentDetailsResponse:
    """Return complete incident details."""

    details = incident_service.get_incident_details(
        incident_id,
    )

    if details is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return details


# ----------------------------------------------------------------------
# Get one incident
# ----------------------------------------------------------------------

@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def get_incident(
    incident_id: UUID,
) -> IncidentResponse:
    """Return one incident by ID."""

    incident = incident_service.get_incident(
        incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return incident


# ----------------------------------------------------------------------
# Analyze incident
# ----------------------------------------------------------------------

@router.post(
    "/{incident_id}/analyze",
    response_model=IncidentAnalysisResponse,
)
def analyze_incident(
    incident_id: UUID,
) -> IncidentAnalysisResponse:
    """Analyze an incident using historical Hindsight memory."""

    analysis = incident_service.analyze_incident(
        incident_id,
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return analysis


# ----------------------------------------------------------------------
# Resolve incident
# ----------------------------------------------------------------------

@router.post(
    "/{incident_id}/resolve",
    response_model=IncidentResponse,
)
def resolve_incident(
    incident_id: UUID,
    resolution_data: IncidentResolve,
) -> IncidentResponse:
    """Resolve an incident."""

    incident = incident_service.resolve_incident(
        incident_id,
        resolution_data,
    )

    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return incident


# ----------------------------------------------------------------------
# Create postmortem + retain Hindsight memory
# ----------------------------------------------------------------------

@router.post(
    "/{incident_id}/postmortem",
    response_model=IncidentPostmortemResponse,
)
def create_postmortem(
    incident_id: UUID,
    postmortem: IncidentPostmortem,
) -> IncidentPostmortemResponse:
    """Create a postmortem and retain it in Hindsight."""

    try:
        result = incident_service.create_postmortem(
            incident_id,
            postmortem,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return result