import os

import httpx
from dotenv import load_dotenv

load_dotenv()

api_url = os.getenv("HINDSIGHT_API_URL")
api_key = os.getenv("HINDSIGHT_API_KEY")

if not api_url:
    raise RuntimeError("HINDSIGHT_API_URL is missing")

if not api_key:
    raise RuntimeError("HINDSIGHT_API_KEY is missing")

response = httpx.get(
    f"{api_url}/v1/default/banks",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=30.0,
)

response.raise_for_status()

data = response.json()

for bank in data.get("banks", []):
    print(f"bank_id = {bank.get('bank_id')}")
    print(f"name    = {bank.get('name')}")
    print("---")