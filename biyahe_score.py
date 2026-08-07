"""
biyahe_score.py — The Sakay Algorithm: Para PH's route scoring engine.

Computes a composite "Biyahe Score" for each candidate route based on:
  - Time (minutes)
  - Cost (pesos)
  - Hassle (transfers, walk distance, terminal waits)
  - Safety (area safety, night safety)
  - Reliability (how often the route actually runs)
  - Community preference (ratings from tracked commutes)

Weights are user-adjustable. Default weights favor balanced commuting.
"""

from typing import Dict, List, Optional
from database import supabase


# ── Default Weights ─────────────────────────────────────
# Sum to 1.0 — each represents relative importance

DEFAULT_WEIGHTS = {
    "time": 0.30,        # Total travel time
    "cost": 0.25,        # Total fare
    "hassle": 0.25,      # Transfers + walking + terminal waits
    "safety": 0.10,      # Route and area safety
    "reliability": 0.05, # How often the route runs
    "community": 0.05,   # Community ratings
}

# Preset profiles for different commuter types
PROFILES = {
    "balanced": DEFAULT_WEIGHTS,
    "budget": {"time": 0.10, "cost": 0.50, "hassle": 0.15, "safety": 0.10, "reliability": 0.10, "community": 0.05},
    "fastest": {"time": 0.60, "cost": 0.10, "hassle": 0.10, "safety": 0.10, "reliability": 0.05, "community": 0.05},
    "safest":  {"time": 0.10, "cost": 0.10, "hassle": 0.10, "safety": 0.50, "reliability": 0.10, "community": 0.10},
    "comfort": {"time": 0.15, "cost": 0.10, "hassle": 0.50, "safety": 0.15, "reliability": 0.05, "community": 0.05},
}


# ── Scoring Functions ───────────────────────────────────

def score_time(total_time_min: float, max_time: float = 120.0) -> float:
    """Score travel time. 0-1 scale, lower time = higher score."""
    if total_time_min <= 0:
        return 1.0
    return max(0.0, 1.0 - (total_time_min / max_time))


def score_cost(total_fare: float, max_fare: float = 200.0) -> float:
    """Score total cost. 0-1 scale, lower cost = higher score."""
    if total_fare <= 0:
        return 1.0
    return max(0.0, 1.0 - (total_fare / max_fare))


def score_hassle(segments: List[Dict]) -> float:
    """
    Score hassle factor. 0-1 scale, lower hassle = higher score.
    
    Factors:
      - Number of transfers (each transfer = -0.15)
      - Total walk distance (over 500m = penalty)
      - Terminal waits (jeepney/bus terminals = extra wait)
    """
    if not segments:
        return 0.5
    
    transfer_count = sum(1 for s in segments if s.get("is_transfer"))
    total_walk_m = sum(s.get("distance_m", 0) for s in segments if s.get("is_transfer"))
    
    # Transfer penalty
    transfer_penalty = min(transfer_count * 0.15, 0.6)
    
    # Walk penalty (over 200m starts hurting)
    walk_penalty = min((total_walk_m - 200) / 800, 0.3) if total_walk_m > 200 else 0
    
    score = 1.0 - transfer_penalty - walk_penalty
    return max(0.0, score)


def score_safety(segments: List[Dict], is_night: bool = False) -> float:
    """
    Score safety. 0-1 scale, higher safety = higher score.
    
    Factors:
      - Route safety_score from database
      - Night safety flag
      - Default 0.5 if no data available
    """
    if not segments:
        return 0.5
    
    # Get unique routes in this path
    route_names = set()
    for s in segments:
        name = s.get("route", "")
        if name and name not in ("WALK_TRANSFER", "WALK_TO_ROUTE", "WALK_TO_DEST", ""):
            route_names.add(name)
    
    if not route_names:
        return 0.5
    
    # Average safety across all routes in the path
    # For now, use defaults — these get updated from DB when available
    total_safety = 0
    for name in route_names:
        # TODO: fetch actual safety_score from ph_routes
        # For now, default 0.5
        total_safety += 0.5
    
    avg_safety = total_safety / len(route_names)
    
    # Night penalty
    if is_night:
        avg_safety *= 0.7
    
    return avg_safety


def score_reliability(segments: List[Dict]) -> float:
    """
    Score reliability. 0-1 scale, higher = more reliable.
    
    Based on route frequency and actual availability data.
    Default 0.5 until community data populates this.
    """
    if not segments:
        return 0.5
    
    route_names = set()
    for s in segments:
        name = s.get("route", "")
        if name and name not in ("WALK_TRANSFER", "WALK_TO_ROUTE", "WALK_TO_DEST", ""):
            route_names.add(name)
    
    if not route_names:
        return 0.5
    
    # TODO: fetch frequency_min and reliability_score from ph_routes
    # For now, default
    return 0.5


def score_community(segments: List[Dict]) -> float:
    """
    Score community preference. 0-1 scale, higher = more preferred.
    
    Based on ratings from tracked commutes.
    Default 0 until community data populates this.
    """
    # TODO: fetch community_rating from ph_routes
    return 0.0


# ── Main Biyahe Score Calculator ───────────────────────

def compute_biyahe_score(
    route: Dict,
    weights: Dict[str, float] = None,
    is_night: bool = False,
) -> Dict:
    """
    Compute the Biyahe Score for a single route.
    
    Args:
        route: Route dict with segments, total_time_min, total_fare
        weights: User preference weights (default: balanced)
        is_night: Whether it's nighttime (affects safety)
    
    Returns:
        Dict with individual scores, composite score, and explanation
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
    
    segments = route.get("segments", [])
    total_time = route.get("total_time_min", 60)
    total_fare = route.get("total_fare", 50)
    
    # Compute individual scores
    time_score = score_time(total_time)
    cost_score = score_cost(total_fare)
    hassle_score = score_hassle(segments)
    safety_score = score_safety(segments, is_night)
    reliability_score = score_reliability(segments)
    community_score = score_community(segments)
    
    # Composite score (weighted sum)
    composite = (
        time_score * weights.get("time", 0.3) +
        cost_score * weights.get("cost", 0.25) +
        hassle_score * weights.get("hassle", 0.25) +
        safety_score * weights.get("safety", 0.1) +
        reliability_score * weights.get("reliability", 0.05) +
        community_score * weights.get("community", 0.05)
    )
    
    # Generate human-readable explanation
    explanations = []
    if time_score > 0.8:
        explanations.append("⏱ Fast route")
    if cost_score > 0.8:
        explanations.append("💰 Budget-friendly")
    if hassle_score > 0.8:
        explanations.append("🔄 Few transfers")
    if safety_score > 0.7:
        explanations.append("🛡 Safe route")
    
    return {
        "biyahe_score": round(composite, 3),
        "scores": {
            "time": round(time_score, 3),
            "cost": round(cost_score, 3),
            "hassle": round(hassle_score, 3),
            "safety": round(safety_score, 3),
            "reliability": round(reliability_score, 3),
            "community": round(community_score, 3),
        },
        "explanation": ", ".join(explanations) if explanations else "Standard route",
        "weights_used": weights,
    }


def rank_routes(
    routes: List[Dict],
    weights: Dict[str, float] = None,
    is_night: bool = False,
    top_k: int = 3,
) -> List[Dict]:
    """
    Score and rank multiple candidate routes.
    
    Args:
        routes: List of route dicts from find_route()
        weights: User preference weights
        is_night: Whether it's nighttime
        top_k: Number of top routes to return
    
    Returns:
        Top K routes sorted by Biyahe Score, each with scoring metadata
    """
    scored = []
    for route in routes:
        result = compute_biyahe_score(route, weights, is_night)
        scored.append({**route, **result})
    
    scored.sort(key=lambda r: r["biyahe_score"], reverse=True)
    return scored[:top_k]


# ── Profile Helper ──────────────────────────────────────

def get_profile(profile_name: str = "balanced") -> Dict[str, float]:
    """Get a preset weight profile by name."""
    return PROFILES.get(profile_name, DEFAULT_WEIGHTS)
