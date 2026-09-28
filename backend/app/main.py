import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes.incidents import router as incidents_router


app = FastAPI(
    title="OpsMemory",
    version="0.1.0",
    description="Memory-powered DevOps Incident Response Agent",
)


def get_allowed_origins() -> list[str]:
    """
    Return allowed frontend origins from the environment.

    Multiple origins can be provided as a comma-separated value.
    localhost is kept as a default for local development.
    """

    configured_origins = os.getenv(
        "FRONTEND_URLS",
        "http://localhost:3000",
    )

    origins = [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
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
        "description": (
            "Memory-powered DevOps Incident Response Agent"
        ),
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "opsmemory-api",
    }