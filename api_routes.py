"""
api_routes.py — Core chat and routing endpoints.
"""

import traceback
from fastapi import APIRouter, Request

from graph_engine import find_route, find_k_routes, get_walking_path, haversine
from llm_engine import parse_chat_intent, normalize_location
from models import ChatMessage, ChatResponse, RouteRequest, RouteResponse, RouteStep
from biyahe_score import compute_biyahe_score, rank_routes, get_profile

router = APIRouter()


# ── Helpers ────────────────────────────────────────────

def _format_segments(route: dict) -> list[str]:
    """Format route segments into human-readable lines for chat replies."""
    lines = []
    for seg in route.get("segments", []):
        if seg.get("is_transfer"):
            time_min = seg.get("time_min", 0)
            if time_min > 0.5:
                lines.append(f"  🚶 Walk {time_min:.0f} min")
        else:
            route_name = seg.get("route", "")
            if route_name in ("WALK_TO_ROUTE", "WALK_TO_DEST", "WALK_TRANSFER", ""):
                continue
            time_min = seg.get("time_min", 0)
            fare = seg.get("fare", 0)
            if time_min > 0.5 or seg.get("distance_m", 0) > 100:
                lines.append(f"  🚌 {route_name} ({time_min:.0f} min, ₱{fare:.0f})")
    return lines


def _build_chat_reply(origin_raw: str, dest_raw: str, route: dict) -> str:
    """Build a complete chat reply string from a route result."""
    lines = [f"📍 {origin_raw} ➡️ {dest_raw}"]
    lines.append(f"✅ {route['message']}")
    lines.append("")
    lines.extend(_format_segments(route))
    return "\n".join(lines)


# ── Endpoints ──────────────────────────────────────────

@router.post("/chat")
async def chat(request: ChatMessage, req: Request):
    """Parse a natural-language message and return a route (or helpful reply)."""
    try:
        G = req.app.state.G
        intent = parse_chat_intent(request.message)

        # Handle non-routing intents
        intent_type = intent.get("intent", "unknown")

        if intent_type == "greeting":
            return ChatResponse(reply_text=(
                "Kumusta! 👋 Ako si Para PH, ang iyong commuting assistant.\n\n"
                "Sabihin mo lang kung saan ka galing at papunta:\n"
                "• from UPD to UST\n"
                "• from Cubao to Makati\n"
                "• from Ateneo to DLSU\n\n"
                "Ano ang maitutulong ko sa'yo ngayon?"
            ))

        if intent_type == "help":
            return ChatResponse(reply_text=(
                "🚐 Heto ang mga kaya kong gawin:\n\n"
                "1. **Humanap ng ruta** — Sabihin mo lang: 'from [pinanggalingan] to [pupuntahan]'\n"
                "2. Kilalanin ang mga lugar — Alam ko ang mga universities, malls, stations, at landmarks sa Metro Manila\n"
                "3. Magbigay ng oras at pamasahe — Kasama ang estimated travel time at fare\n\n"
                "Subukan mo: 'from UPD to UST' o 'from Cubao to Makati'"
            ))

        if intent_type == "about":
            return ChatResponse(reply_text=(
                "🚐 Ako si Para PH — ang iyong multi-modal commuting assistant para sa Metro Manila!\n\n"
                "Alam ko ang mga ruta ng jeep, bus, LRT, MRT, at UV Express. "
                "Ginagamit ko ang Dijkstra algorithm para mahanap ang pinakamabilis na ruta para sa'yo.\n\n"
                "Gawa ako ng ParaOrg, isang grupo ng mga estudyante na gustong mapabuti ang commuting experience sa Pilipinas. 🇵🇭"
            ))

        if intent_type == "unknown":
            return ChatResponse(reply_text=(
                "🚐 Para PH — Ang iyong commuting assistant!\n\n"
                "Pwede mong gawin ang mga sumusunod:\n\n"
                "1. 🔍 Maghanap ng ruta — I-type: 'from UPD to UST' o 'from Cubao to Makati'\n"
                "2. 📤 Mag-upload ng bagong ruta — Pumunta sa Community page\n"
                "3. 💬 Magtanong — I-type ang 'help' para sa tulong\n\n"
                "Ano ang gusto mong gawin ngayon?"
            ))

        # ── Route finding ──
        origin_raw = intent.get("origin", "")
        dest_raw = intent.get("destination", "")

        # If only destination (no origin), try GPS
        if dest_raw and not origin_raw and request.user_location:
            origin_raw = "here"
        
        if not origin_raw or not dest_raw:
            return ChatResponse(reply_text=(
                "Please specify both origin and destination. Example: 'from UPD to UST'"
            ))

        # Handle "here" — use GPS coords if available
        if origin_raw.lower() in ("here", "current location", "my location"):
            user_loc = request.user_location
            if user_loc and user_loc.get("lat"):
                origin_geo = {"lat": user_loc["lat"], "lon": user_loc.get("lng", user_loc.get("lon", 0)), "found": True, "display_name": "Your Location", "source": "gps"}
            else:
                return ChatResponse(reply_text="📍 Please enable GPS to route from your location. Tap ⊕ and allow location access.")
        else:
            origin_geo = await normalize_location(origin_raw)
        
        dest_geo = await normalize_location(dest_raw)

        if not origin_geo or not dest_geo:
            return ChatResponse(reply_text=(
                f"Could not find one or both locations.\n"
                f"Origin: {origin_raw}\n"
                f"Destination: {dest_raw}"
            ))

        # Find K candidate routes and rank by Biyahe Score
        candidates = find_k_routes(
            G,
            origin_geo["lat"], origin_geo["lon"],
            dest_geo["lat"], dest_geo["lon"],
            k=3
        )

        if not candidates:
            return ChatResponse(reply_text=(
                f"Walang nakitang ruta from '{origin_raw}' to '{dest_raw}'."
            ))

        # Score and rank all candidates
        ranked = rank_routes(candidates)
        best_route = ranked[0]

        # Simple reply text - route cards show the details
        reply_text = f"Here are {len(ranked)} routes from {origin_raw} to {dest_raw}." if len(ranked) > 1 else f"Here is the best route from {origin_raw} to {dest_raw}."


        route = best_route

        # Deduplicate alternatives
        ranked_filtered = [a for a in ranked[1:] if [s.get("route","") for s in a.get("segments",[])] != [s.get("route","") for s in best_route.get("segments",[])]]
        
        # Enhance walk segments with actual walking paths
        if route and route.get("segments"):
            for seg in route["segments"]:
                if (seg.get("is_transfer") or seg.get("type") == "walk" or "WALK" in str(seg.get("route", ""))) and seg.get("geometry") and len(seg["geometry"]) >= 2:
                    start = seg["geometry"][0]
                    end = seg["geometry"][-1]
                    # start/end are [lng, lat] from backend
                    walk_path = await get_walking_path(start[1], start[0], end[1], end[0])
                    if walk_path and len(walk_path) > 2:
                        # Convert back to [lng, lat] for consistency
                        seg["geometry"] = [[c[1], c[0]] for c in walk_path]
                        seg["distance_m"] = sum(
                            haversine(walk_path[i][0], walk_path[i][1], walk_path[i+1][0], walk_path[i+1][1])
                            for i in range(len(walk_path)-1)
                        )

        return ChatResponse(
            reply_text=reply_text,
            route_data=route,
            origin=origin_raw,
            destination=dest_raw,
        )

    except Exception:
        traceback.print_exc()
        return ChatResponse(reply_text="Sorry, may naging problema sa paghahanap ng ruta. Please try again.")


@router.post("/route", response_model=RouteResponse)
async def calculate_route(request: RouteRequest, req: Request):
    """Calculate route between two lat/lng points (programmatic endpoint)."""
    G = req.app.state.G

    route = find_route(
        G,
        request.origin_lat, request.origin_lng,
        request.dest_lat, request.dest_lng,
    )

    if not route:
        return RouteResponse(
            success=False,
            total_distance_m=0,
            total_duration_min=0,
            total_fare=0,
            steps=[],
            path_nodes=[],
            message="No route found",
        )

    steps = []
    for seg in route.get("segments", []):
        steps.append(RouteStep(
            from_stop=seg.get("from", ""),
            to_stop=seg.get("to", ""),
            route_name=seg.get("route", ""),
            mode=seg.get("type", ""),
            distance_m=seg.get("distance_m", 0),
            duration_min=seg.get("time_min", 0),
            fare=seg.get("fare", 0),
        ))

    return RouteResponse(
        success=True,
        total_distance_m=route.get("total_distance_m", 0),
        total_duration_min=route.get("total_time_min", 0),
        total_fare=route.get("total_fare", 0),
        steps=steps,
        path_nodes=route.get("path", []),
        message=route.get("message", "Route found"),
    )
# force deploy
