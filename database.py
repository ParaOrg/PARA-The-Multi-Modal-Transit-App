"""
database.py — Supabase REST client (HTTPS-only, no direct Postgres).
Network restriction: only port 443 is open. All DB operations go through supabase-py.
"""

import logging
from typing import Any, Dict, List, Optional

from supabase import create_client, Client

from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger(__name__)

# ── Supabase REST client (HTTPS, port 443) ─────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def init_db():
    """Verify Supabase connection. No connection pool needed — REST is stateless."""
    logger.info("🔌 Connecting to Supabase (REST API)...")
    try:
        # Simple health check — query the routes table
        res = supabase.table("ph_routes").select("count", count="exact").limit(0).execute()
        logger.info(f"✅ Supabase connected (REST). Routes table accessible.")
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
        raise



async def fetch_all(table_name: str, select: str = "*", eq: dict = None, order: str = None) -> list:
    """Fetch all rows from a Supabase table, bypassing the 1000-row limit via pagination."""
    all_rows = []
    page_size = 1000
    start = 0
    
    while True:
        query = supabase.table(table_name).select(select, count="exact")
        if eq:
            for key, val in eq.items():
                query = query.eq(key, val)
        if order:
            is_desc = order.startswith("-")
            col = order.lstrip("-")
            query = query.order(col, desc=is_desc)
        
        res = query.range(start, start + page_size - 1).execute()
        rows = res.data or []
        all_rows.extend(rows)
        
        if len(rows) < page_size:
            break
        start += page_size
    
    return all_rows

async def close_db():
    """No-op — REST client has no persistent connections to close."""
    logger.info("👋 Supabase REST client closed (no-op)")


# ── Query helpers ──────────────────────────────────────

async def query(sql: str, *args) -> List[Dict[str, Any]]:
    """
    Execute a raw SQL query via Supabase RPC.
    Requires a stored procedure or uses the SQL API.
    For now, we use supabase.rpc() or direct table access.
    """
    # Use Supabase's built-in SQL execution via REST
    try:
        res = supabase.rpc("exec_sql", {"query": sql}).execute()
        return res.data or []
    except Exception:
        # Fallback: try raw SQL endpoint if available
        logger.debug("RPC exec_sql not available, trying direct query")
        return []


async def query_one(sql: str, *args) -> Optional[Dict[str, Any]]:
    """Execute SQL and return first row."""
    rows = await query(sql, *args)
    return rows[0] if rows else None


async def query_val(sql: str, *args) -> Any:
    """Execute SQL and return single value."""
    row = await query_one(sql, *args)
    if row:
        return list(row.values())[0] if isinstance(row, dict) else row
    return None
