OpsMemory
AI Incident Response Agent That Learns From Every Incident
OpsMemory is a memory-powered AI incident response platform for recurring production incidents.
Instead of treating every incident as a new problem, OpsMemory recalls relevant historical incident experience, gives that context to an AI reasoning step, keeps remediation under human control, and turns confirmed outcomes into long-term operational memory.
🚀 Live Demo
Frontend:
https://ops-memory-psi.vercel.app/
Backend API:
https://opsmemory-myoq.onrender.com/
Health Check:
https://opsmemory-myoq.onrender.com/health
Demo Flow
v3.2.0 → v3.3.0 → v3.4.0
The three incidents demonstrate cumulative learning:
v3.2.0 → 0 historical memories

v3.3.0 → 1 historical memory
           └── v3.2.0

v3.4.0 → 2 historical memories
           ├── v3.3.0
           └── v3.2.0
🧩 The Problem
Production incidents often repeat:
- the same service fails after a deployment
- the same symptoms appear again
- engineers investigate from scratch
- useful incident knowledge remains buried in old postmortems
OpsMemory makes that past experience available during the next incident.
💡 The Solution
OpsMemory closes the loop between incident response and organizational memory.
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
The key idea is simple:
Remember what happened, what was confirmed, and use that experience the next time a similar incident occurs.

🧠 Why Hindsight?
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
RECALL → REASON → RESOLVE → LEARN
                    ↑         |
                    └─────────┘
🔄 Memory Impact
OpsMemory makes the influence of historical memory visible during incident analysis.
For a new incident, the UI shows:
- how many historical experiences were recalled
- which previous deployment or incident they came from
- the previously recorded resolution
- that the historical experience was supplied as evidence to the AI
- that the human operator still validates the actual production action
Example:
Current Incident
      ↓
Hindsight Recall
      ↓
Previous Incident v3.3.0
      ↓
Previous Incident v3.2.0
      ↓
AI Reasoning
This makes the hindsight contribution observable instead of hiding it inside the backend.
👨‍💻 Human-in-the-Loop
OpsMemory is designed to support engineers rather than autonomously execute production remediation.
The AI
- analyzes the current incident
- uses historical memory as evidence
- states uncertainty when evidence is insufficient
- suggests investigation or remediation steps
The human operator
- investigates logs, metrics, deployments, and other evidence
- decides what action to take
- confirms the actual outcome
- provides the postmortem learning
Only the confirmed outcome becomes long-term operational memory.
🎬 Demo Scenario
The project uses three connected incidents to demonstrate cumulative learning.
v3.2.0
A payment-api deployment is followed by a sharp HTTP 500 spike.
The incident is resolved by rolling back to the previous stable version.
The confirmed postmortem is retained in Hindsight.
Historical memories recalled:
0
Flow:
v3.2.0
   ↓
Incident
   ↓
AI Analysis
   ↓
Human Resolution
   ↓
Postmortem
   ↓
Hindsight Retain
v3.3.0
The payment-api shows the same deployment-related 5xx pattern.
OpsMemory recalls the v3.2.0 incident and provides it as historical evidence to the AI.
The incident is resolved and its confirmed learning is retained.
Historical memories recalled:
1
└── v3.2.0
Flow:
v3.3.0
   ↓
Hindsight Recall
   ↓
v3.2.0
   ↓
AI Reasoning
   ↓
Human Resolution
   ↓
Postmortem
   ↓
Hindsight Retain
v3.4.0
The same pattern happens again after v3.4.0.
OpsMemory can now recall the two earlier incidents:
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
Historical memories recalled:
2
├── v3.3.0
└── v3.2.0
This demonstrates that the system can reuse accumulated operational experience across incidents.
📈 Memory Progression
Incident	Historical Memories Recalled	Historical Context
v3.2.0	0	None
v3.3.0	1	v3.2.0
v3.4.0	2	v3.3.0 + v3.2.0


The progression demonstrates cumulative hindsight learning across repeated incidents.
🏗️ Architecture
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
⚙️ Technology Stack
Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS
Backend
- FastAPI
- Python
- Pydantic
- SQLAlchemy
- SQLite
AI and Memory
- Hindsight
- OpenAI-compatible LLM API
- openai Python SDK
Validation
- Pytest
- Python compile checks
- ESLint
- Next.js production build
🔌 Core API
POST /api/incidents/
GET  /api/incidents/
GET  /api/incidents/{incident_id}
GET  /api/incidents/{incident_id}/details

POST /api/incidents/{incident_id}/analyze
POST /api/incidents/{incident_id}/resolve
POST /api/incidents/{incident_id}/postmortem
Health endpoint:
GET /health
📁 Project Structure
OpsMemory/
├── backend/
│   ├── app/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── security.py
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
│   └── manual/
│       └── list_hindsight_banks.py
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
🔐 Security
OpsMemory keeps production secrets outside the source code.
The application supports optional API-key authentication for incident API routes.
Authentication is controlled using:
API_AUTH_ENABLED=false
API_KEY=
When authentication is enabled:
API_AUTH_ENABLED=true
API_KEY=your-secret-key
The frontend does not contain Hindsight or LLM secrets.
Sensitive environment variables belong only in the backend deployment environment.
Never commit:
.env
API keys
Hindsight credentials
LLM credentials
Historical incident content is treated as untrusted evidence during AI analysis rather than as executable instructions.
🛠️ Local Setup
1. Clone the repository
git clone https://github.com/sohan181204/OpsMemory.git
cd OpsMemory
2. Create and activate the Python environment
Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
Linux/macOS
python3 -m venv .venv
source .venv/bin/activate
3. Install backend dependencies
pip install -r requirements.txt
4. Configure environment variables
Create a local .env file from .env.example.
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=
HINDSIGHT_BANK_ID=OpsMemory Incident Memory

LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=

APP_ENV=development
FRONTEND_URLS=http://localhost:3000

API_AUTH_ENABLED=false
API_KEY=
Example OpenAI-compatible configuration:
LLM_API_KEY=your-llm-api-key
LLM_BASE_URL=https://api.example.com/openai/v1
LLM_MODEL=your-model-name
Do not commit .env or API keys to GitHub.
5. Start the backend
From the repository root:
uvicorn backend.app.main:app --reload
Backend:
http://127.0.0.1:8000
Health endpoint:
http://127.0.0.1:8000/health
6. Start the frontend
Open a second terminal:
cd frontend
npm install
npm run dev
Frontend:
http://localhost:3000
For the deployed frontend, configure:
NEXT_PUBLIC_API_URL=https://opsmemory-myoq.onrender.com
For local development, configure:
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
🧪 Demo Data
The repository includes a deterministic three-incident demo database.
Run:
python scripts/seed_demo_database.py
The demo incidents are:
v3.2.0
v3.3.0
v3.4.0
The seed operation is designed to be idempotent for the canonical demo incidents.
The current demonstration relies on the existing Hindsight memory bank for historical recall.
Avoid repeatedly seeding an already-populated Hindsight demonstration bank because duplicate historical records can be created.
🔍 Hindsight Memory Behavior
OpsMemory applies safeguards before historical memory reaches the AI reasoning step.
Chronological filtering
A future incident must not influence analysis of an earlier incident.
Allowed:

v3.4.0 ← v3.3.0
v3.4.0 ← v3.2.0

Not allowed:

v3.2.0 ← v3.4.0
Source-aware deduplication
Only one recalled memory is kept for each historical source incident.
Incident mapping
Returned Hindsight memories are mapped back to known local incidents before being used.
Evidence-aware reasoning
Historical memories are treated as evidence rather than unquestionable truth.
🧪 Testing
Backend tests
From the repository root:
pytest -q
Expected backend test result for the current MVP:
12 passed
Python compilation
python -m compileall backend scripts
Frontend lint
cd frontend
npm run lint
Frontend production build
npm run build
The project was also validated with:
git diff --check
git diff --cached --check
🧠 Design Principles
Persistent operational memory
Incident knowledge is retained beyond the lifecycle of a single request.
Evidence-aware reasoning
Historical memory is treated as evidence, not unquestionable truth.
Chronological safety
Future incidents are not allowed to influence analysis of earlier incidents.
Source-aware deduplication
Only one recalled memory is kept for each historical source incident.
Human control
The AI suggests actions, while the human operator confirms the actual production outcome.
Learn from confirmed outcomes
The postmortem captures the confirmed cause, resolution, and lesson before the knowledge is retained for future incidents.
🔁 End-to-End Learning Loop
┌──────────────────┐
│ Current Incident │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Hindsight Recall │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   AI Reasoning   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Human Validation │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Resolution    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Postmortem    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Hindsight Retain │
└────────┬─────────┘
         │
         └───────────────┐
                         │
                         ▼
                 Better next incident
🎯 What the Hackathon Demo Proves
OpsMemory demonstrates:
1. Persistent memory
The system remembers confirmed outcomes after an incident has been resolved.
2. Hindsight recall
A later incident can retrieve relevant historical experience.
3. Memory-guided reasoning
Historical experiences are supplied to the AI as evidence during analysis.
4. Cumulative learning
The number of useful historical experiences grows across the demonstration:
v3.2.0 → 0
v3.3.0 → 1
v3.4.0 → 2
5. Human-in-the-loop control
The system suggests actions, but the human operator confirms the actual resolution.
6. Learning from confirmed outcomes
The confirmed postmortem becomes future operational knowledge.
🌐 Deployment
Frontend
Deployed using Vercel:
https://ops-memory-psi.vercel.app/
Frontend environment variable:
NEXT_PUBLIC_API_URL=https://opsmemory-myoq.onrender.com
Backend
Deployed using Render:
https://opsmemory-myoq.onrender.com
Health check:
https://opsmemory-myoq.onrender.com/health
The backend deployment initializes the demo SQLite database before starting the FastAPI application.
📊 Current Demo State
Incident	Status	Memories Recalled	Resolution
v3.2.0	Resolved	0	Rollback
v3.3.0	Resolved	1	Rollback
v3.4.0	Resolved	2	Rollback


The purpose of this progression is to make cumulative hindsight learning visible during the live demonstration.
🏆 Hackathon Focus
OpsMemory is built around the idea:
AI agents should not just solve incidents — they should learn from what humans confirmed about previous incidents.

The project combines:
AI Reasoning
     +
Persistent Memory
     +
Historical Evidence
     +
Human Validation
     +
Continuous Learning
The result is an incident-response workflow where every confirmed incident can improve future investigations.
🚀 Future Scope
Potential extensions include:
- richer observability integrations
- Slack or Microsoft Teams incident intake
- deployment and change-management integrations
- automated incident timelines
- richer memory provenance and confidence visualization
- SRE metrics such as SLI/SLO context
- role-based access control and audit history
- production deployment with managed infrastructure
- additional incident types and operational domains
📌 Repository
GitHub:
https://github.com/sohan181204/OpsMemory