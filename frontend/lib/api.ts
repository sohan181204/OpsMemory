const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type Severity =
  | "SEV-1"
  | "SEV-2"
  | "SEV-3"
  | "SEV-4";

export type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "RESOLVED";

export type Incident = {
  id: string;
  service: string;
  environment: string;
  severity: Severity;
  title: string;
  description: string;
  deployment_version: string | null;
  status: IncidentStatus;
  created_at: string;
};

export type IncidentMemory = {
  text: string;
  score: number | null;
};

export type IncidentAnalysis = {
  summary: string;
  probable_cause: string;
  recommended_action: string;
  created_at: string;
};

export type IncidentPostmortem = {
  probable_cause: string;
  resolution: string;
  lesson: string;
  memory_retained: boolean;
  created_at: string;
};

export type IncidentDetails = {
  incident: Incident;
  resolution: string | null;
  analysis: IncidentAnalysis | null;
  postmortem: IncidentPostmortem | null;
  memories: IncidentMemory[];
};

export type CreateIncidentData = {
  service: string;
  environment: string;
  severity: Severity;
  title: string;
  description: string;
  deployment_version?: string;
};

export type PostmortemResponse = {
  incident_id: string;
  status: string;
  memory_retained: boolean;
  message: string;
};

export async function getIncidents(): Promise<Incident[]> {
  const response = await fetch(
    `${API_URL}/api/incidents/`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch incidents: ${response.status}`,
    );
  }

  return response.json();
}

export async function getIncident(
  incidentId: string,
): Promise<Incident> {
  const response = await fetch(
    `${API_URL}/api/incidents/${incidentId}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch incident: ${response.status}`,
    );
  }

  return response.json();
}

export async function getIncidentDetails(
  incidentId: string,
): Promise<IncidentDetails> {
  const response = await fetch(
    `${API_URL}/api/incidents/${incidentId}/details`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch incident details: ${response.status}`,
    );
  }

  return response.json();
}

export async function createIncident(
  data: CreateIncidentData,
): Promise<Incident> {
  const response = await fetch(
    `${API_URL}/api/incidents/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Failed to create incident: ${response.status} ${message}`,
    );
  }

  return response.json();
}

export async function analyzeIncident(
  incidentId: string,
): Promise<IncidentDetails> {
  const response = await fetch(
    `${API_URL}/api/incidents/${incidentId}/analyze`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Failed to analyze incident: ${response.status} ${message}`,
    );
  }

  return getIncidentDetails(incidentId);
}

export async function resolveIncident(
  incidentId: string,
  resolution: string,
): Promise<Incident> {
  const response = await fetch(
    `${API_URL}/api/incidents/${incidentId}/resolve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resolution,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Failed to resolve incident: ${response.status} ${message}`,
    );
  }

  return response.json();
}

export async function createPostmortem(
  incidentId: string,
  probableCause: string,
  resolution: string,
  lesson: string,
): Promise<PostmortemResponse> {
  const response = await fetch(
    `${API_URL}/api/incidents/${incidentId}/postmortem`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        probable_cause: probableCause,
        resolution,
        lesson,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Failed to create postmortem: ${response.status} ${message}`,
    );
  }

  return response.json();
}