from backend.app.services.llm_service import LLMService


def test_parse_response_multiline_sections() -> None:
    content = """
SUMMARY:
The payment-api experienced an HTTP 500 spike.

PROBABLE_CAUSE:
A deployment regression is suspected.

RECOMMENDED_ACTION:
Compare the deployment with the previous stable version.
"""

    result = LLMService._parse_response(content)

    assert result["summary"] == (
        "The payment-api experienced an HTTP 500 spike."
    )

    assert result["probable_cause"] == (
        "A deployment regression is suspected."
    )

    assert result["recommended_action"] == (
        "Compare the deployment with the previous stable version."
    )


def test_parse_response_inline_sections() -> None:
    content = """
SUMMARY: The payment-api experienced an HTTP 500 spike.
PROBABLE_CAUSE: A deployment regression is suspected.
RECOMMENDED_ACTION: Compare the deployment with the previous stable version.
"""

    result = LLMService._parse_response(content)

    assert result["summary"] == (
        "The payment-api experienced an HTTP 500 spike."
    )

    assert result["probable_cause"] == (
        "A deployment regression is suspected."
    )

    assert result["recommended_action"] == (
        "Compare the deployment with the previous stable version."
    )


def test_parse_response_preserves_text_case() -> None:
    content = """
SUMMARY:
The Payment API returned HTTP 500 errors.

PROBABLE_CAUSE:
A Regression may have been introduced by v3.4.0.

RECOMMENDED_ACTION:
Inspect the Release Configuration before remediation.
"""

    result = LLMService._parse_response(content)

    assert result["summary"] == (
        "The Payment API returned HTTP 500 errors."
    )

    assert result["probable_cause"] == (
        "A Regression may have been introduced by v3.4.0."
    )

    assert result["recommended_action"] == (
        "Inspect the Release Configuration before remediation."
    )


def test_parse_response_supports_markdown_headers() -> None:
    content = """
**SUMMARY:**
The payment-api experienced an HTTP 500 spike.

**PROBABLE_CAUSE:**
A deployment regression is suspected.

**RECOMMENDED_ACTION:**
Inspect the release and compare it with the previous stable version.
"""

    result = LLMService._parse_response(content)

    assert result["summary"] == (
        "The payment-api experienced an HTTP 500 spike."
    )

    assert result["probable_cause"] == (
        "A deployment regression is suspected."
    )

    assert result["recommended_action"] == (
        "Inspect the release and compare it with the previous stable version."
    )


def test_parse_response_supports_spaced_headings() -> None:
    content = """
SUMMARY: Payment-api is returning HTTP 500 errors.
PROBABLE CAUSE: A deployment regression is suspected.
RECOMMENDED ACTION: Compare the current release with the last stable release.
"""

    result = LLMService._parse_response(content)

    assert result["summary"] == (
        "Payment-api is returning HTTP 500 errors."
    )

    assert result["probable_cause"] == (
        "A deployment regression is suspected."
    )

    assert result["recommended_action"] == (
        "Compare the current release with the last stable release."
    )


def test_parse_response_supports_markdown_heading_levels() -> None:
    content = """
### SUMMARY:
The Payment API has elevated HTTP 500 responses.

## PROBABLE_CAUSE:
The available evidence suggests a deployment regression.

# RECOMMENDED_ACTION:
Compare deployment configuration and prepare the safest rollback option.
"""

    result = LLMService._parse_response(content)

    assert result["summary"] == (
        "The Payment API has elevated HTTP 500 responses."
    )

    assert result["probable_cause"] == (
        "The available evidence suggests a deployment regression."
    )

    assert result["recommended_action"] == (
        "Compare deployment configuration and prepare the safest rollback option."
    )


def test_parse_response_falls_back_to_unstructured_content() -> None:
    content = """
The service is returning elevated HTTP 500 responses.
The available evidence is insufficient to confirm the root cause.
Review recent deployments and supporting telemetry.
"""

    result = LLMService._parse_response(content)

    assert result["summary"] == (
        "The service is returning elevated HTTP 500 responses.\n"
        "The available evidence is insufficient to confirm the root cause.\n"
        "Review recent deployments and supporting telemetry."
    )

    assert result["probable_cause"] == ""
    assert result["recommended_action"] == ""