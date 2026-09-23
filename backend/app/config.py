import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

CWA_API_KEY = os.getenv("CWA_API_KEY", "")
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "600"))
PORT = int(os.getenv("PORT", "8000"))

# Base URLs
CWA_BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore"
