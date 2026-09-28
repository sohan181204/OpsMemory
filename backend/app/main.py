from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes.incidents import router as incidents_router


app = FastAPI(
    title="OpsMemory",
    version="0.1.0",
    description="Memory-powered DevOps Incident Response Agent",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(incidents_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "OpsMemory",
        "version": "0.1.0",
        "description": "Memory-powered DevOps Incident Response Agent",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "opsmemory-api",
    }