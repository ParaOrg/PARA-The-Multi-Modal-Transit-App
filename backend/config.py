"""
config.py — Single source of truth for all environment configuration.
Every other module imports from here. No scattered os.getenv() calls.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (one directory up from this file)
ENV_PATH = Path(__file__).resolve().parent / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    # Try Render's default environment (env vars set directly, no .env file)
    load_dotenv()

def _require(name: str) -> str:
    """Get required env var. Crash early with clear message if missing."""
    value = os.getenv(name)
    if not value:
        print(f"❌ Missing required environment variable: {name}")
        print(f"   Create a .env file at {ENV_PATH} with:")
        print(f"   {name}=<your_value>")
        sys.exit(1)
    return value

def _optional(name: str, default: str = "") -> str:
    """Get optional env var with fallback."""
    return os.getenv(name, default)


# ── Supabase ───────────────────────────────────────────
SUPABASE_URL = _require("SUPABASE_URL")
SUPABASE_SERVICE_KEY = _require("SUPABASE_SERVICE_KEY")

# Direct Postgres connection (for asyncpg / PostGIS queries)
# Supabase provides this as: postgresql://postgres:<password>@<host>:5432/postgres
DATABASE_URL = _require("DATABASE_URL")

# ── Ollama ─────────────────────────────────────────────
OLLAMA_HOST = _optional("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = _optional("OLLAMA_MODEL", "llama3")

# ── App ────────────────────────────────────────────────
ENV = _optional("ENV", "development")
PORT = int(_optional("PORT", "8000"))
CORS_ORIGINS = _optional("CORS_ORIGINS", "*")

# ── Validation ─────────────────────────────────────────
def _validate():
    """Log loaded config (mask secrets)."""
    masked_key = SUPABASE_SERVICE_KEY[:10] + "..." if len(SUPABASE_SERVICE_KEY) > 10 else "***"
    print(f"📋 Config loaded:")
    print(f"   SUPABASE_URL: {SUPABASE_URL}")
    print(f"   SUPABASE_SERVICE_KEY: {masked_key}")
    print(f"   DATABASE_URL: {DATABASE_URL[:40]}...")
    print(f"   OLLAMA_HOST: {OLLAMA_HOST}")
    print(f"   ENV: {ENV}")

_validate()
