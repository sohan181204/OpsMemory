from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


Severity = Literal["SEV-1", "SEV-2", "SEV-3", "SEV-4"]
IncidentStatus = Literal["OPEN", "INVESTIGATING", "RESOLVED"]


class IncidentCreate(BaseModel):
    """Data submitted when a new incident is created."""

    service: str = Field(..., min_length=1, max_length=100)
    environment: str = Field(..., min_length=1, max_length=50)
    severity: Severity
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    deployment_version: str | None = Field(
        default=None,
        max_length=100,
    )

class IncidentResolve(BaseModel):
    """Information submitted when an incident is resolved."""

    resolution: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class IncidentPostmortem(BaseModel):
    """Postmortem information retained as organizational memory."""

    probable_cause: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )

    resolution: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )

    lesson: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class IncidentPostmortemResponse(BaseModel):
    """Result of storing a postmortem in Hindsight."""

    incident_id: UUID
    status: str
    memory_retained: bool
    message: str


class IncidentResponse(BaseModel):
    """Incident returned by the API."""

    id: UUID = Field(default_factory=uuid4)
    service: str
    environment: str
    severity: Severity
    title: str
    description: str
    deployment_version: str | None = None
    status: IncidentStatus = "OPEN"
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class IncidentMemory(BaseModel):
    """A relevant memory returned by Hindsight."""

    text: str
    score: float | None = None


class IncidentAnalysisResponse(BaseModel):
    """Analysis result for an incident."""

    incident_id: UUID
    status: str
    summary: str
    probable_cause: str
    recommended_action: str
    memories: list[IncidentMemory]

class IncidentAnalysisDetails(BaseModel):
    """Persisted AI analysis."""

    summary: str
    probable_cause: str
    recommended_action: str
    created_at: datetime


class IncidentPostmortemDetails(BaseModel):
    """Persisted incident postmortem."""

    probable_cause: str
    resolution: str
    lesson: str
    memory_retained: bool
    created_at: datetime


class IncidentDetailsResponse(BaseModel):
    """Complete incident view for the dashboard."""

    incident: IncidentResponse
    resolution: str | None = None
    analysis: IncidentAnalysisDetails | None = None
    postmortem: IncidentPostmortemDetails | None = None
    memories: list[IncidentMemory]