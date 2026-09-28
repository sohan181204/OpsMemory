import pytest
from fastapi import HTTPException

from backend.app.security import require_api_key


def test_api_auth_disabled(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_AUTH_ENABLED",
        "false",
    )

    require_api_key(None)


def test_api_auth_requires_key(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_AUTH_ENABLED",
        "true",
    )

    monkeypatch.setenv(
        "API_KEY",
        "test-secret",
    )

    with pytest.raises(HTTPException) as exc_info:
        require_api_key(None)

    assert exc_info.value.status_code == 401


def test_api_auth_rejects_wrong_key(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_AUTH_ENABLED",
        "true",
    )

    monkeypatch.setenv(
        "API_KEY",
        "test-secret",
    )

    with pytest.raises(HTTPException) as exc_info:
        require_api_key("wrong-secret")

    assert exc_info.value.status_code == 401


def test_api_auth_accepts_correct_key(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_AUTH_ENABLED",
        "true",
    )

    monkeypatch.setenv(
        "API_KEY",
        "test-secret",
    )

    require_api_key("test-secret")


def test_api_auth_fails_if_key_not_configured(monkeypatch) -> None:
    monkeypatch.setenv(
        "API_AUTH_ENABLED",
        "true",
    )

    monkeypatch.delenv(
        "API_KEY",
        raising=False,
    )

    with pytest.raises(HTTPException) as exc_info:
        require_api_key("anything")

    assert exc_info.value.status_code == 500