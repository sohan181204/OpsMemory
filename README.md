# OpsMemory

## AI Incident Response Agent That Learns From Every Incident

OpsMemory is a memory-powered AI incident response platform for recurring production incidents.

Instead of treating every incident as a new problem, OpsMemory recalls relevant historical incident experience, gives that context to an AI reasoning step, keeps remediation under human control, and turns the confirmed outcome into long-term operational memory.

## The Problem

Production incidents often repeat:

- the same service fails after a deployment
- the same symptoms appear again
- engineers investigate from scratch
- useful incident knowledge remains buried in old postmortems

OpsMemory makes that past experience available during the next incident.

## The Solution

OpsMemory closes the loop between incident response and organizational memory:

```text
Incident
   ↓
Hindsight Recall
   ↓
AI Reasoning
   ↓
Human Investigation
   ↓
Human Resolution
   ↓
Postmortem
   ↓
Hindsight Retain
   ↓
Better Future Investigations
```

The key idea is simple:

> Remember what happened, what was confirmed, and use that experience the next time a similar incident occurs.

## Why Hindsight?

Hindsight is the long-term memory layer of OpsMemory.

During analysis, the application:

1. builds a query from the current incident
2. recalls related historical experiences from Hindsight
3. maps returned memories to known local incidents
4. ignores memories that cannot be safely placed in the incident timeline
5. keeps only memories from incidents that happened earlier
6. keeps one memory per historical source incident
7. provides the retained historical context to the LLM

After a human resolves the incident, the confirmed postmortem is retained in Hindsight.

This creates the learning loop:

```text
RECALL → REASON → RESOLVE → LEARN
                    ↑         |
                    └─────────┘
```

## Human-in-the-Loop

OpsMemory is designed to support engineers rather than autonomously execute production remediation.

The AI:

- analyzes the current incident
- uses historical memory as evidence
- states uncertainty when evidence is insufficient
- suggests investigation or remediation steps

The human operator:

- investigates logs, metrics, deployments, and other evidence
- decides what action to take
- confirms the actual outcome
- provides the postmortem learning

Only the confirmed outcome becomes long-term operational memory.

## Demo Scenario

The project uses three connected incidents to demonstrate cumulative learning.

### v3.2.0

A payment-api deployment is followed by a sharp HTTP 500 spike.

The incident is resolved by rolling back to the previous stable version.

The confirmed postmortem is retained in Hindsight.

### v3.3.0

The payment-api shows the same deployment-related 5xx pattern.

OpsMemory recalls the v3.2.0 incident and provides it as historical evidence to the AI.

The incident is resolved and its confirmed learning is retained.

### v3.4.0

The same pattern happens again after v3.4.0.

OpsMemory can now recall the two earlier incidents:

```text
v3.4.0 current incident
        ↓
Hindsight Recall
        ↓
v3.3.0 historical experience
v3.2.0 historical experience
        ↓
AI Reasoning
        ↓
Human Resolution
        ↓
Postmortem
        ↓
Hindsight Retain
```

This demonstrates that the system can reuse accumulated operational experience across incidents.

## Architecture

```text
                         ┌─────────────────────┐
                         │      Next.js UI     │
                         │  Incident dashboard │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      FastAPI        │
                         │     Application     │
                         └───────┬─────┬───────┘
                                 │     │
                    ┌────────────┘     └─────────────┐
                    ▼                                ▼
           ┌─────────────────┐              ┌─────────────────┐
           │    SQLite DB    │              │    Hindsight    │
           │                 │              │  Recall/Retain  │
           │ incidents       │              │                 │
           │ AI analysis     │              └────────┬────────┘
           │ postmortems     │                       │
           └─────────────────┘                       ▼
                                           ┌─────────────────┐
                                           │ OpenAI-          │
                                           │ compatible LLM  │
                                           │    reasoning    │
                                           └─────────────────┘
```

## Technology Stack

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS

### Backend

- FastAPI
- Python
- Pydantic
- SQLAlchemy
- SQLite

### AI and Memory

- Hindsight
- OpenAI-compatible LLM API
- `openai` Python SDK

### Validation

- Pytest
- Python compile checks
- ESLint
- Next.js production build

## Core API

```text
POST /api/incidents/
GET  /api/incidents/
GET  /api/incidents/{incident_id}
GET  /api/incidents/{incident_id}/details

POST /api/incidents/{incident_id}/analyze
POST /api/incidents/{incident_id}/resolve
POST /api/incidents/{incident_id}/postmortem
```

## Project Structure

```text
OpsMemory/
├── backend/
│   ├── app/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── services/
│   │       ├── hindsight_service.py
│   │       ├── incident_service.py
│   │       └── llm_service.py
│   └── tests/
│
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
│
├── scripts/
│   ├── seed_demo_database.py
│   ├── seed_memory.py
│   └── verify_memory.py
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/sohan181204/OpsMemory.git
cd OpsMemory
```

### 2. Create and activate the Python environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a local `.env` file from `.env.example`.

```env
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=
HINDSIGHT_BANK_ID=OpsMemory Incident Memory

LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=

APP_ENV=development
FRONTEND_URLS=http://localhost:3000
```

Do not commit `.env` or API keys to GitHub.

### 5. Start the backend

From the repository root:

```bash
uvicorn backend.app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Health endpoint:

```text
http://127.0.0.1:8000/health
```

### 6. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

## Demo Data

The repository includes a deterministic three-incident demo database:

```bash
python scripts/seed_demo_database.py
```

The demo incidents are:

- v3.2.0
- v3.3.0
- v3.4.0

The Hindsight seeding script is also included for setting up the demonstration memory bank:

```bash
python scripts/seed_memory.py
```

Use the memory seeding script only when initializing a clean demonstration memory bank. Re-running it against an already seeded bank can create duplicate memories.

## Verifying the Memory Timeline

Run:

```bash
python scripts/verify_memory.py
```

The verification checks that recalled memories can be mapped to known incidents and that only earlier incidents are accepted into the analysis context.

## Testing

Backend tests:

```bash
pytest -q
```

Python compilation:

```bash
python -m compileall backend scripts
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend production build:

```bash
npm run build
```

## Design Principles

### Persistent operational memory

Incident knowledge is retained beyond the lifecycle of a single request.

### Evidence-aware reasoning

Historical memory is treated as evidence, not unquestionable truth.

### Chronological safety

Future incidents are not allowed to influence analysis of earlier incidents.

### Source-aware deduplication

Only one recalled memory is kept for each historical source incident.

### Human control

The AI suggests actions, while the human operator confirms the actual production outcome.

### Learn from confirmed outcomes

The postmortem captures the confirmed cause, resolution, and lesson before the knowledge is retained for future incidents.

## Current Status

✅ Hackathon MVP — Demo Ready

The core incident-response and hindsight-learning workflow is implemented and validated locally.

## Future Scope

Potential extensions include:

- richer observability integrations
- Slack or Teams incident intake
- deployment and change-management integrations
- automated incident timelines
- richer memory provenance and confidence visualization
- SRE metrics such as SLI/SLO context
- role-based access control and audit history
- production deployment with managed infrastructure

## License

No license has been added to the repository yet.
