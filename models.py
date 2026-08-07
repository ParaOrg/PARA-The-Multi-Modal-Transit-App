"""
models.py — Pydantic models for Para PH API.
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── Chat ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    user_id: Optional[str] = "guest"
    message: str
    session_id: Optional[str] = None
    timestamp: Optional[datetime] = None


class ChatResponse(BaseModel):
    reply_text: str
    route_data: Optional[Dict[str, Any]] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    alternatives: Optional[List[Dict[str, Any]]] = None
    task_id: Optional[str] = None
    status: str = "completed"


# ── Routing ─────────────────────────────────────────────

class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    user_id: Optional[str] = "guest"
    mode: Optional[str] = "transit"


class RouteStep(BaseModel):
    from_stop: str
    to_stop: str
    route_name: str
    mode: str
    distance_m: float
    duration_min: float
    fare: float


class RouteResponse(BaseModel):
    success: bool
    total_distance_m: float
    total_duration_min: float
    total_fare: float
    steps: List[RouteStep]
    path_nodes: List[str]
    message: str
    alternatives: Optional[List[Dict[str, Any]]] = None


# ── Feedback ────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    user_id: str
    route_id: str
    rating: int
    comment: Optional[str] = None
    route_nodes: Optional[List[str]] = None
    origin_name: Optional[str] = None
    destination_name: Optional[str] = None
    total_fare: Optional[float] = None
    total_time: Optional[float] = None
    timestamp: Optional[datetime] = None


# ── Telemetry ───────────────────────────────────────────

class TelemetryPing(BaseModel):
    device_id: str
    lat: float
    lng: float
    speed_kmh: Optional[float] = 0
    heading: Optional[float] = 0
    trip_id: Optional[str] = None
    timestamp: Optional[datetime] = None


class TelemetryBatch(BaseModel):
    pings: List[TelemetryPing]
    device_id: Optional[str] = None


class SimulateRequest(BaseModel):
    route_name: str
    count: int = 10


# ── Tasks ───────────────────────────────────────────────

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: Optional[int] = 0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    completed_at: Optional[str] = None


# ── Geocoding ───────────────────────────────────────────

class GeoRequest(BaseModel):
    location: str
    user_id: Optional[str] = "guest"
    bounds: Optional[Dict[str, float]] = None


class GeoResponse(BaseModel):
    found: bool
    lat: Optional[float] = None
    lon: Optional[float] = None
    display_name: Optional[str] = None
    source: Optional[str] = None
    confidence: Optional[float] = 0


# ── Admin ───────────────────────────────────────────────

class RouteMetadata(BaseModel):
    name: str
    mode: str
    type: str
    oneway: bool
    bidirectional: bool
    file: str
    source: str
    edge_count: int = 0


class RouteListResponse(BaseModel):
    routes: List[RouteMetadata]
    total: int
