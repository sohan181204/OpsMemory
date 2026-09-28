import os
import unittest
from unittest.mock import MagicMock, patch

from backend.app.services.hindsight_service import HindsightService


class TestHindsightService(unittest.TestCase):

    def test_requires_api_key(self):
        with patch.dict(
            os.environ,
            {"HINDSIGHT_API_URL": "https://example.com"},
            clear=True,
        ):
            with self.assertRaisesRegex(
                ValueError,
                "HINDSIGHT_API_KEY is missing",
            ):
                HindsightService()

    @patch("backend.app.services.hindsight_service.Hindsight")
    def test_retain_uses_configured_bank(self, hindsight_mock):
        client = MagicMock()
        hindsight_mock.return_value = client

        with patch.dict(
            os.environ,
            {
                "HINDSIGHT_API_URL": "https://example.com",
                "HINDSIGHT_API_KEY": "test-key",
                "HINDSIGHT_BANK_ID": "test-bank",
            },
            clear=True,
        ):
            service = HindsightService()
            service.retain("incident learning record")

        hindsight_mock.assert_called_once_with(
            base_url="https://example.com",
            api_key="test-key",
        )
        client.retain.assert_called_once_with(
            bank_id="test-bank",
            content="incident learning record",
        )

    @patch("backend.app.services.hindsight_service.Hindsight")
    def test_recall_maps_text_and_score(self, hindsight_mock):
        client = MagicMock()

        first_result = MagicMock()
        first_result.text = "Previous incident"
        first_result.scores.final = 0.92

        second_result = MagicMock()
        second_result.text = "Another incident"
        second_result.scores.final = 0.81

        client.recall.return_value = [first_result, second_result]
        hindsight_mock.return_value = client

        with patch.dict(
            os.environ,
            {
                "HINDSIGHT_API_URL": "https://example.com",
                "HINDSIGHT_API_KEY": "test-key",
                "HINDSIGHT_BANK_ID": "test-bank",
            },
            clear=True,
        ):
            service = HindsightService()
            memories = service.recall("payment-api HTTP 500")

        client.recall.assert_called_once_with(
            bank_id="test-bank",
            query="payment-api HTTP 500",
        )

        self.assertEqual(
            memories,
            [
                {"text": "Previous incident", "score": 0.92},
                {"text": "Another incident", "score": 0.81},
            ],
        )


if __name__ == "__main__":
    unittest.main()
