import os
import secrets

from dotenv import load_dotenv
from fastapi import Header, HTTPException, status


load_dotenv()


def is_api_auth_enabled() -> bool:
    """Return whether API-key authentication is enabled."""

    return (
        os.getenv(
            "API_AUTH_ENABLED",
            "false",
        )
        .strip()
        .lower()
        == "true"
    )


def require_api_key(
    x_api_key: str | None = Header(default=None),
) -> None:
    """
    Protect API routes with an API key when authentication is enabled.

    Authentication remains disabled by default so the local hackathon
    frontend continues to work without sending a secret.

    When enabled:
    - API_KEY must be configured.
    - Requests must include the X-API-Key header.
    """

    if not is_api_auth_enabled():
        return

    configured_key = os.getenv("API_KEY", "").strip()

    if not configured_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "API authentication is enabled but API_KEY "
                "is not configured."
            ),
        )

    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key.",
        )

    if not secrets.compare_digest(
        x_api_key.strip(),
        configured_key,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )