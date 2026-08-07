"""
llm_engine.py — Semantic parsing, geocoding, and location normalization.
Data sources: in-memory gazetteer + Supabase ph_places (REST) + Nominatim fallback.
No SQLite. No direct Postgres. All Supabase access via REST API.
"""

import re
import hashlib
import logging
from typing import Optional, Dict

from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

from database import supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Metro Manila bounds ─────────────────────────────────
MM_LAT_MIN, MM_LAT_MAX = 14.35, 14.80
MM_LON_MIN, MM_LON_MAX = 120.90, 121.20

# ── In-memory gazetteer (fast path, no DB hit) ──────────
GAZETTEER_COORDS: Dict[str, tuple] = {
    # Universities
    "ateneo": (14.6404, 121.0772, "Ateneo de Manila University"),
    "admu": (14.6404, 121.0772, "Ateneo de Manila University"),
    "dlsu": (14.5649, 120.9930, "De La Salle University"),
    "lasalle": (14.5649, 120.9930, "De La Salle University"),
    "la salle": (14.5649, 120.9930, "De La Salle University"),
    "feu": (14.6038, 120.9863, "Far Eastern University"),
    "ue": (14.6021, 120.9893, "University of the East"),
    "nu": (14.6025, 120.9875, "National University"),
    "pup": (14.5973, 121.0104, "Polytechnic University of the Philippines"),
    "upd": (14.6550, 121.0677, "University of the Philippines Diliman"),
    "up diliman": (14.6550, 121.0677, "University of the Philippines Diliman"),
    "ust": (14.6091, 120.9893, "University of Santo Tomas"),
    # Malls
    "sm north": (14.6560, 121.0315, "SM City North EDSA"),
    "sm north edsa": (14.6560, 121.0315, "SM City North EDSA"),
    "trinoma": (14.6533, 121.0340, "TriNoma"),
    "megamall": (14.5844, 121.0572, "SM Megamall"),
    "sm megamall": (14.5844, 121.0572, "SM Megamall"),
    "moa": (14.5350, 120.9821, "SM Mall of Asia"),
    "mall of asia": (14.5350, 120.9821, "SM Mall of Asia"),
    "glorietta": (14.5526, 121.0241, "Glorietta"),
    "greenbelt": (14.5532, 121.0201, "Greenbelt"),
    "bgc": (14.5487, 121.0468, "Bonifacio Global City"),
    # Transport hubs
    "cubao": (14.6190, 121.0540, "Araneta Center Cubao"),
    "pitx": (14.5070, 120.9900, "PITX"),
    "buendia": (14.5550, 121.0160, "Buendia Terminal"),
    # Stations
    "north avenue": (14.6522, 121.0325, "North Avenue MRT"),
    "north ave": (14.6522, 121.0325, "North Avenue MRT"),
    "edsa": (14.5430, 121.0170, "EDSA MRT Station"),
    "taft": (14.5375, 120.9835, "Taft Avenue LRT"),
    # Landmarks
    "quiapo": (14.5992, 120.9839, "Quiapo Church"),
    "baclaran": (14.5368, 120.9970, "Baclaran Church"),
    "luneta": (14.5830, 120.9790, "Rizal Park"),
    "intramuros": (14.5900, 120.9750, "Intramuros"),
    "divisoria": (14.6060, 120.9740, "Divisoria"),
    "binondo": (14.6005, 120.9750, "Binondo"),
    "philcoa": (14.6660, 121.0500, "Philcoa"),
    "eastwood": (14.6130, 121.0900, "Eastwood City"),
    # Areas
    "makati": (14.5547, 121.0244, "Makati CBD"),
    "ortigas": (14.5840, 121.0590, "Ortigas Center"),
    "katipunan": (14.6370, 121.0760, "Katipunan Avenue"),
    "katips": (14.6370, 121.0760, "Katipunan Avenue"),
    "commonwealth": (14.6800, 121.0800, "Commonwealth Avenue"),
    "espana": (14.6120, 120.9930, "España Boulevard"),
    "aurora": (14.6180, 121.0600, "Aurora Boulevard"),
    "q ave": (14.6400, 121.0200, "Quezon Avenue"),
}

_cache: Dict[str, Dict] = {}

def _get_cache_key(query: str) -> str:
    return hashlib.md5(query.encode()).hexdigest()


async def _lookup_supabase_place(query: str) -> Optional[Dict]:
    """Look up a location in ph_places via Supabase REST API."""
    try:
        # Exact match on canonical name
        res = supabase.table("ph_places").select("*").eq("canonical_name", query).eq("is_active", True).limit(1).execute()
        if res.data:
            row = res.data[0]
            loc = row.get("location")
            if loc:
                # location is PostGIS geography — extract lat/lng
                lat, lng = _extract_coords(loc)
                if lat and lng:
                    return {"found": True, "lat": lat, "lon": lng, "display_name": row["canonical_name"], "query": query, "source": "supabase_places"}

        # Try aliases
        res = supabase.table("ph_place_aliases").select("*, ph_places(*)").eq("alias", query).limit(1).execute()
        if res.data:
            row = res.data[0]
            place = row.get("ph_places", {})
            loc = place.get("location")
            if loc:
                lat, lng = _extract_coords(loc)
                if lat and lng:
                    return {"found": True, "lat": lat, "lon": lng, "display_name": place.get("canonical_name", query), "query": query, "source": "supabase_alias"}

        # Try geocode cache
        cache_key = _get_cache_key(query)
        res = supabase.table("ph_geocode_cache").select("*").eq("query_hash", cache_key).limit(1).execute()
        if res.data:
            row = res.data[0]
            loc = row.get("location")
            if loc:
                lat, lng = _extract_coords(loc)
                if lat and lng:
                    return {"found": True, "lat": lat, "lon": lng, "display_name": row.get("display_name", query), "query": query, "source": "geocode_cache"}

    except Exception as e:
        logger.warning(f"⚠️ Supabase place lookup error: {e}")

    return None


def _extract_coords(location) -> tuple:
    """Extract (lat, lng) from a PostGIS geography/geometry object returned by Supabase."""
    if isinstance(location, str):
        # Try WKT format: POINT(lng lat)
        match = re.match(r"POINT\s*\(\s*([\d.]+)\s+([\d.]+)\s*\)", location, re.IGNORECASE)
        if match:
            return float(match.group(2)), float(match.group(1))
    if isinstance(location, dict):
        # GeoJSON format
        coords = location.get("coordinates", [])
        if len(coords) == 2:
            return coords[1], coords[0]
    return None, None


def _geocode_nominatim(query: str) -> Optional[Dict]:
    """Geocode using Nominatim with Metro Manila viewbox."""
    try:
        geolocator = Nominatim(user_agent="para_ph_v3", timeout=10)
        geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.0, max_retries=2)
        location = geocode(query, exactly_one=True, limit=1,
                          viewbox=[(MM_LAT_MIN, MM_LON_MIN), (MM_LAT_MAX, MM_LON_MAX)], bounded=False)
        if location and MM_LAT_MIN <= location.latitude <= MM_LAT_MAX and MM_LON_MIN <= location.longitude <= MM_LON_MAX:
            return {"found": True, "lat": location.latitude, "lon": location.longitude,
                    "display_name": location.address, "query": query, "source": "nominatim"}
    except Exception as e:
        logger.warning(f"⚠️ Nominatim geocoding failed for '{query}': {e}")
    return None


async def normalize_location(query: str) -> Optional[Dict]:
    """Normalize a location string → {lat, lon, display_name}."""
    if not query: return None
    query_lower = query.lower().strip()

    if query_lower in GAZETTEER_COORDS:
        lat, lon, display = GAZETTEER_COORDS[query_lower]
        return {"found": True, "lat": lat, "lon": lon, "display_name": display, "query": query_lower, "source": "gazetteer"}

    cache_key = _get_cache_key(query_lower)
    if cache_key in _cache: return _cache[cache_key]

    result = await _lookup_supabase_place(query_lower)
    if result:
        _cache[cache_key] = result
        return result

    result = _geocode_nominatim(f"{query}, Metro Manila, Philippines")
    if not result: result = _geocode_nominatim(query)
    if result: _cache[cache_key] = result
    else: logger.warning(f"⚠️ Could not resolve location: '{query}'")
    return result


def parse_chat_intent(text: str) -> Dict:
    """Parse chat message for origin/destination or casual intents."""
    text_lower = text.lower().strip()

    greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "kumusta", "yo"]
    if any(text_lower.startswith(g) for g in greetings): return {"intent": "greeting"}

    help_phrases = ["help", "what can you do", "how to", "ano", "paano", "tulong"]
    if any(h in text_lower for h in help_phrases): return {"intent": "help"}

    about_phrases = ["who are you", "what are you", "sino ka", "ano ka"]
    if any(a in text_lower for a in about_phrases): return {"intent": "about"}

    patterns = [
        r"from\s+(.+?)\s+to\s+(.+)",
        r"(.+?)\s+(?:to|papuntang|pa)\s+(.+)",
        r"pumunta\s+(?:ng|sa)\s+(.+?)\s+(?:mula|galing)\s+(?:sa|ng)\s+(.+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match and len(match.groups()) >= 2:
            groups = match.groups()
            if "mula" in text_lower or "galing" in text_lower:
                return {"origin": groups[1].strip(), "destination": groups[0].strip(), "intent": "route"}
            return {"origin": groups[0].strip(), "destination": groups[1].strip(), "intent": "route"}

    return {"intent": "unknown", "text": text}
