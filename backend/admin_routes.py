"""
admin_routes.py — Admin endpoints for route management.
All data via Supabase REST API (table operations). No raw SQL.
"""

import io
import csv
from fastapi import APIRouter, HTTPException, Query, Response
from typing import Dict, Any

from database import supabase, fetch_all

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Helpers ─────────────────────────────────────────────

def _row_to_dict(row: dict) -> dict:
    return {
        "route_uuid": str(row.get("route_uuid", "")),
        "name": row.get("name", ""),
        "mode": row.get("mode", ""),
        "is_loop": row.get("is_loop", False),
        "is_bidirectional": row.get("is_bidirectional", False),
        "is_oneway": row.get("is_oneway", False),
        "is_approved": row.get("is_approved", False),
        "status": row.get("status", "pending"),
        "created_at": str(row.get("created_at", "")),
        "length_m": None,
    }


# ── GET /admin/routes ──────────────────────────────────

@router.get("/routes")
async def list_routes_root():
    return await list_routes()


@router.get("/routes/list")
async def list_routes():
    """List all routes from Supabase."""
    rows = await fetch_all("ph_routes", order="name")
    routes = [_row_to_dict(r) for r in rows]
    return {"routes": routes, "total": len(routes)}


@router.get("/routes/geojson")
async def get_route_geojson(route_id: str = Query(..., description="Route UUID")):
    """Get a single route's geometry as GeoJSON."""
    # Get route metadata
    route_res = supabase.table("ph_routes").select("*").eq("route_uuid", route_id).limit(1).execute()
    if not route_res.data:
        raise HTTPException(404, f"Route not found: {route_id}")
    route = route_res.data[0]

    # Get geometry
    shape_res = supabase.table("ph_route_shapes").select("geom_geojson").eq("route_uuid", route_id).limit(1).execute()
    if not shape_res.data or not shape_res.data[0].get("geom_geojson"):
        raise HTTPException(404, f"No geometry for route: {route_id}")

    geometry = shape_res.data[0]["geom_geojson"]
    if isinstance(geometry, str):
        import json
        geometry = json.loads(geometry)

    return {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "name": route.get("name"),
                "mode": route.get("mode"),
                "is_loop": route.get("is_loop", False),
                "is_bidirectional": route.get("is_bidirectional", False),
                "is_oneway": route.get("is_oneway", False),
            },
            "geometry": geometry,
        }],
    }


@router.get("/routes/verified")
async def list_verified_routes():
    """List only approved/verified routes."""
    rows = await fetch_all("ph_routes", eq={"is_approved": True}, order="name")
    routes = [_row_to_dict(r) for r in rows]
    return {"routes": routes, "total": len(routes)}


@router.get("/routes/csv")
async def export_routes_csv():
    """Export all routes as CSV."""
    res = supabase.table("ph_routes").select("*", count="exact").order("name").range(0, 99999).execute()
    rows = res.data or []
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["route_uuid", "name", "mode", "is_loop", "is_bidirectional", "is_oneway", "is_approved", "status"])
    for r in rows:
        writer.writerow([r["route_uuid"], r.get("name"), r.get("mode"),
                        r.get("is_loop"), r.get("is_bidirectional"), r.get("is_oneway"),
                        r.get("is_approved"), r.get("status")])
    return Response(content=output.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=routes_export.csv"})


@router.get("/routes/stats")
async def get_route_stats():
    """Get aggregate statistics about all routes."""
    rows = await fetch_all("ph_routes")
    total = len(rows)
    mode_counts = {}
    approved = 0
    oneway = 0
    bidirectional = 0
    loop = 0
    for r in rows:
        mode = r.get("mode", "unknown")
        mode_counts[mode] = mode_counts.get(mode, 0) + 1
        if r.get("is_approved"): approved += 1
        if r.get("is_oneway"): oneway += 1
        if r.get("is_bidirectional"): bidirectional += 1
        if r.get("is_loop"): loop += 1
    return {"total_routes": total, "route_types": mode_counts, "approved_count": approved,
            "oneway_count": oneway, "bidirectional_count": bidirectional, "loop_count": loop}



@router.get("/routes/reference")
async def list_reference_routes():
    """List unique reference routes from ph_route_reference table (deduplicated by name)."""
    try:
        routes = await fetch_all("ph_route_reference", order="route_name")
        # Deduplicate by route_name — keep first occurrence
        seen = set()
        unique = []
        for r in routes:
            name = (r.get("route_name") or "").strip().lower()
            if name and name not in seen:
                seen.add(name)
                unique.append(r)
        return {"routes": unique, "total": len(unique)}
    except Exception as e:
        return {"routes": [], "total": 0, "error": str(e)}

@router.get("/graph/stats")
async def get_graph_stats():
    """Get database statistics."""
    routes_res = supabase.table("ph_routes").select("*", count="exact").eq("is_approved", True).execute()
    shapes_res = supabase.table("ph_route_shapes").select("*", count="exact").execute()
    return {"status": "ok", "routes_in_db": routes_res.count or 0, "shapes_in_db": shapes_res.count or 0}


# ── POST /admin/routes ─────────────────────────────────

@router.post("/routes/rename")
async def rename_route(route_id: str = Query(...), new_name: str = Query(...)):
    """Rename a route."""
    res = supabase.table("ph_routes").update({"name": new_name, "updated_at": "now()"}).eq("route_uuid", route_id).execute()
    if not res.data:
        raise HTTPException(404, f"Route not found: {route_id}")
    return {"status": "success", "message": f"Renamed to '{new_name}'", "route_uuid": route_id}


@router.post("/routes/verify")
async def verify_route(route_id: str = Query(...)):
    """Mark a route as verified/approved."""
    res = supabase.table("ph_routes").update({"is_approved": True, "status": "verified", "updated_at": "now()"}).eq("route_uuid", route_id).execute()
    if not res.data:
        raise HTTPException(404, f"Route not found: {route_id}")
    return {"status": "success", "message": "Route verified", "route_uuid": route_id}



@router.delete("/routes/{route_id}")
async def delete_route(route_id: str):
    """Delete a route and its shape."""
    supabase.table("ph_route_shapes").delete().eq("route_uuid", route_id).execute()
    supabase.table("ph_routes").delete().eq("route_uuid", route_id).execute()
    return {"status": "success", "message": "Route deleted", "route_uuid": route_id}


@router.post("/routes/reload")
async def reload_routes():
    return {"status": "info", "message": "Data is live from Supabase. No cache to reload. Restart server to rebuild graph."}


# ── Community / Pending Routes ─────────────────────────

@router.post("/routes/save")
async def save_community_route(data: Dict[str, Any]):
    """Save a community-submitted route."""
    features = data.get("features", [])
    if not features:
        raise HTTPException(400, "No features in GeoJSON")

    props = features[0].get("properties", {})
    geom = features[0].get("geometry", {})
    route_name = props.get("route_long_name") or props.get("name", "Community Route")
    mode = props.get("type") or props.get("mode", "jeepney")

    # Insert route
    route_res = supabase.table("ph_routes").insert({
        "name": route_name, "mode": mode, "is_approved": False, "status": "pending", "submitted_by": "community"
    }).execute()
    route_uuid = route_res.data[0]["route_uuid"]

    # Insert geometry
    import json
    geom_str = json.dumps(geom) if isinstance(geom, dict) else str(geom)
    supabase.table("ph_route_shapes").insert({
        "route_uuid": route_uuid, "geom_geojson": geom_str
    }).execute()

    return {"status": "success", "message": f"Route saved: {route_name}", "route_uuid": route_uuid}


@router.get("/pending/list")
async def list_pending_routes():
    """List pending community-submitted routes."""
    rows = await fetch_all("ph_routes", eq={"is_approved": False, "status": "pending"}, order="-created_at")
    routes = [{ "route_uuid": r["route_uuid"], "name": r.get("name"), "mode": r.get("mode"), "created_at": str(r.get("created_at", "")) } for r in rows]
    return {"routes": routes, "total": len(routes)}


@router.get("/pending/geojson/{route_id}")
async def get_pending_geojson(route_id: str):
    """Get a pending route's GeoJSON for review."""
    route_res = supabase.table("ph_routes").select("*").eq("route_uuid", route_id).limit(1).execute()
    if not route_res.data: raise HTTPException(404, "Pending route not found")
    route = route_res.data[0]

    shape_res = supabase.table("ph_route_shapes").select("geom_geojson").eq("route_uuid", route_id).limit(1).execute()
    geometry = shape_res.data[0].get("geom_geojson") if shape_res.data else None
    if isinstance(geometry, str):
        import json
        geometry = json.loads(geometry)

    return {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"name": route.get("name"), "mode": route.get("mode")}, "geometry": geometry}]}


@router.post("/pending/approve")
async def approve_route(route_id: str = Query(...)):
    """Approve a pending community route."""
    supabase.table("ph_routes").update({"is_approved": True, "status": "verified", "updated_at": "now()"}).eq("route_uuid", route_id).execute()
    return {"status": "success", "message": "Route approved", "route_uuid": route_id}


@router.post("/pending/reject")
async def reject_route(route_id: str = Query(...), reason: str = Query("")):
    """Reject a pending community route."""
    supabase.table("ph_routes").update({"status": "rejected", "reviewer_note": reason, "updated_at": "now()"}).eq("route_uuid", route_id).execute()
    return {"status": "success", "message": f"Route rejected: {reason}", "route_uuid": route_id}
