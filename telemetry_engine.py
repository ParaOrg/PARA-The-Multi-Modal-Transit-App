"""
Telemetry Engine for Para PH
Handles GPS ping ingestion, congestion analysis, and traffic-aware routing.
Data is anonymized: device_id is hashed client-side before storage.
"""

import hashlib
import math
import sqlite3
import time
from datetime import datetime, timedelta
from collections import defaultdict
import networkx as nx

# --- Constants ---
CONGESTION_WINDOW_MINUTES = 15      # Only consider pings from last 15 min for real-time traffic
MIN_PINGS_FOR_ANALYSIS = 3          # Need at least 3 pings on a segment to calculate speed
ANOMALY_SPEED_MAX_KMH = 120         # Filter out GPS errors (anything faster than this is impossible in PH)
SNAPPING_RADIUS_M = 50              # How close a GPS ping must be to snap to a graph edge

def hash_device_id(device_id: str) -> str:
    """Anonymize device IDs using SHA-256 before storage."""
    return hashlib.sha256(device_id.encode()).hexdigest()[:16]


def ingest_ping(db_path: str, device_id: str, lat: float, lng: float, 
                speed_kmh: float = 0.0, heading: float = 0.0, 
                trip_id: str = None) -> int:
    """
    Store a single GPS ping from a device.
    Returns the ping ID or -1 if filtered out (anomalous speed).
    """
    if speed_kmh > ANOMALY_SPEED_MAX_KMH:
        return -1  # Filter out GPS glitches
    
    if trip_id is None:
        trip_id = f"{hash_device_id(device_id)}_{int(time.time())}"
    
    anon_id = hash_device_id(device_id)
    
    db = sqlite3.connect(db_path)
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO telemetry_pings (device_id, lat, lng, speed_kmh, heading, timestamp, trip_id)
        VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
    """, (anon_id, lat, lng, speed_kmh, heading, trip_id))
    ping_id = cursor.lastrowid
    db.commit()
    db.close()
    
    return ping_id


def snap_ping_to_graph(G: nx.DiGraph, lat: float, lng: float) -> tuple:
    """
    Find the closest edge in the graph to a GPS ping.
    Returns (from_node, to_node, distance_meters) or (None, None, None).
    """
    spatial_grid = G.graph.get('spatial_grid', {})
    grid_size = G.graph.get('grid_size', 0.0005)
    gx, gy = int(lat / grid_size), int(lng / grid_size)
    
    candidate_nodes = []
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            candidate_nodes.extend(spatial_grid.get((gx + dx, gy + dy), []))
    
    best_edge = None
    best_dist = float('inf')
    
    for node in candidate_nodes:
        node_attrs = G.nodes[node]
        n_lat, n_lng = node_attrs.get('lat'), node_attrs.get('lng')
        dist = haversine(lat, lng, n_lat, n_lng)
        
        if dist < SNAPPING_RADIUS_M and dist < best_dist:
            # Check outgoing edges from this node
            for neighbor in G.neighbors(node):
                edge = G.edges[node, neighbor]
                if edge.get('type') != 'walk':  # Only snap to transit edges
                    best_dist = dist
                    best_edge = (node, neighbor, edge.get('route', 'Unknown'))
    
    return best_edge if best_edge else (None, None, None)


def haversine(lat1, lon1, lat2, lon2):
    """Replicated here to avoid circular imports."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def update_congestion(db_path: str, G: nx.DiGraph) -> dict:
    """
    Analyze recent telemetry pings and update traffic_segments table.
    Should be called every N minutes by a background scheduler.
    
    Returns summary dict: {'segments_updated': int, 'avg_congestion': float}
    """
    db = sqlite3.connect(db_path)
    cursor = db.cursor()
    
    # Get pings from the last congestion window
    cutoff = (datetime.utcnow() - timedelta(minutes=CONGESTION_WINDOW_MINUTES)).isoformat()
    cursor.execute("""
        SELECT device_id, lat, lng, speed_kmh, trip_id, timestamp
        FROM telemetry_pings
        WHERE timestamp >= ?
        ORDER BY trip_id, timestamp
    """, (cutoff,))
    
    pings = cursor.fetchall()
    db.close()
    
    if len(pings) < MIN_PINGS_FOR_ANALYSIS:
        return {'segments_updated': 0, 'avg_congestion': 1.0}
    
    # Group pings by trip_id
    trips = defaultdict(list)
    for device_id, lat, lng, speed_kmh, trip_id, timestamp in pings:
        trips[trip_id].append((lat, lng, speed_kmh, timestamp))
    
    # Calculate observed speeds per edge
    edge_speeds = defaultdict(list)
    
    for trip_id, trip_pings in trips.items():
        if len(trip_pings) < 2:
            continue
            
        for i in range(len(trip_pings) - 1):
            lat1, lng1, spd1, ts1 = trip_pings[i]
            lat2, lng2, spd2, ts2 = trip_pings[i + 1]
            
            # Skip if timestamp shows unrealistic time difference
            try:
                t1 = datetime.fromisoformat(ts1)
                t2 = datetime.fromisoformat(ts2)
                dt = (t2 - t1).total_seconds()
                if dt <= 0 or dt > 300:  # Ignore gaps > 5 minutes
                    continue
            except:
                continue
            
            # Snap each ping to graph
            from_edge = snap_ping_to_graph(G, lat1, lng1)
            to_edge = snap_ping_to_graph(G, lat2, lng2)
            
            if from_edge[0] and to_edge[0]:
                # If both snapped to same route, record observed speed
                if from_edge[2] == to_edge[2]:
                    edge_key = f"{from_edge[0]}|{to_edge[1]}|{from_edge[2]}"
                    edge_speeds[edge_key].append(spd1 if spd1 > 0 else (spd1 + spd2) / 2)
    
    # Update traffic_segments table
    db = sqlite3.connect(db_path)
    cursor = db.cursor()
    segments_updated = 0
    total_congestion = 0.0
    
    for edge_key, speeds in edge_speeds.items():
        if len(speeds) < MIN_PINGS_FOR_ANALYSIS:
            continue
            
        from_node, to_node, route_name = edge_key.split('|', 2)
        avg_speed = sum(speeds) / len(speeds)
        
        # Expected speed based on vehicle type (default to jeepney speed)
        expected_speed = 30.0  # SPEED_JEEP_KMH
        
        # Congestion factor: >1 means slower than expected
        if avg_speed > 0:
            congestion = expected_speed / avg_speed
            congestion = max(0.5, min(5.0, congestion))  # Clamp between 0.5x and 5x
        else:
            congestion = 1.0
        
        cursor.execute("""
            INSERT INTO traffic_segments (route_name, from_node, to_node, observed_speed_kmh, observation_count, congestion_factor, last_updated)
            VALUES (?, ?, ?, ?, 1, ?, datetime('now'))
            ON CONFLICT(route_name, from_node, to_node) 
            DO UPDATE SET 
                observed_speed_kmh = (observed_speed_kmh * observation_count + ?) / (observation_count + 1),
                observation_count = observation_count + 1,
                congestion_factor = ?,
                last_updated = datetime('now')
        """, (route_name, from_node, to_node, avg_speed, congestion, avg_speed, congestion))
        
        segments_updated += 1
        total_congestion += congestion
    
    db.commit()
    db.close()
    
    avg_congestion = total_congestion / segments_updated if segments_updated > 0 else 1.0
    
    return {
        'segments_updated': segments_updated,
        'avg_congestion': round(avg_congestion, 2),
        'pings_analyzed': len(pings)
    }


def apply_traffic_to_graph(G: nx.DiGraph, db_path: str) -> nx.DiGraph:
    """
    Apply congestion factors to graph edge weights.
    Returns a NEW graph with adjusted routing weights (doesn't mutate original).
    """
    G_traffic = G.copy()
    
    db = sqlite3.connect(db_path)
    cursor = db.cursor()
    cursor.execute("""
        SELECT route_name, from_node, to_node, congestion_factor
        FROM traffic_segments
        WHERE last_updated >= datetime('now', '-30 minutes')
    """)
    
    traffic_data = cursor.fetchall()
    db.close()
    
    adjusted_edges = 0
    for route_name, from_node, to_node, congestion_factor in traffic_data:
        if G_traffic.has_edge(from_node, to_node):
            original_weight = G_traffic.edges[from_node, to_node].get('routing_weight', 1.0)
            G_traffic.edges[from_node, to_node]['routing_weight'] = original_weight * congestion_factor
            G_traffic.edges[from_node, to_node]['congestion_factor'] = congestion_factor
            adjusted_edges += 1
    
    print(f"🚦 [TRAFFIC] Applied congestion to {adjusted_edges} edges")
    return G_traffic


def get_traffic_geojson(db_path: str) -> dict:
    """Generate a GeoJSON FeatureCollection of traffic conditions for the heatmap."""
    db = sqlite3.connect(db_path)
    cursor = db.cursor()
    cursor.execute("""
        SELECT route_name, from_node, to_node, congestion_factor, observed_speed_kmh
        FROM traffic_segments
        WHERE last_updated >= datetime('now', '-30 minutes')
    """)
    
    rows = cursor.fetchall()
    db.close()
    
    features = []
    for route_name, from_node, to_node, congestion, speed in rows:
        # Parse node coordinates from string "(lat, lng)"
        try:
            from_coords = from_node.strip('()').split(',')
            to_coords = to_node.strip('()').split(',')
            from_lat, from_lng = float(from_coords[0]), float(from_coords[1])
            to_lat, to_lng = float(to_coords[0]), float(to_coords[1])
        except:
            continue
        
        # Color based on congestion
        if congestion < 1.2:
            color = "#22c55e"  # Green - free flow
        elif congestion < 2.0:
            color = "#eab308"  # Yellow - moderate
        elif congestion < 3.0:
            color = "#f97316"  # Orange - heavy
        else:
            color = "#ef4444"  # Red - severe
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[from_lng, from_lat], [to_lng, to_lat]]
            },
            "properties": {
                "route_name": route_name,
                "congestion_factor": round(congestion, 2),
                "observed_speed_kmh": round(speed, 1) if speed else None,
                "color": color
            }
        })
    
    return {
        "type": "FeatureCollection",
        "features": features
    }


def simulate_telemetry_ping(db_path: str, G: nx.DiGraph, route_name: str = None) -> dict:
    """
    FOR DEVELOPMENT/TESTING: Generate a simulated GPS ping along a random route.
    Useful when you don't have real IoT devices connected yet.
    """
    import random
    
    # Pick a random edge from the graph
    edges = [(u, v, d) for u, v, d in G.edges(data=True) if d.get('type') != 'walk']
    if route_name:
        edges = [e for e in edges if e[2].get('route', '').lower() == route_name.lower()]
    
    if not edges:
        return {"error": "No transit edges found for simulation"}
    
    u, v, data = random.choice(edges)
    u_attrs = G.nodes[u]
    v_attrs = G.nodes[v]
    
    # Interpolate a point along the edge
    t = random.random()
    lat = u_attrs['lat'] + (v_attrs['lat'] - u_attrs['lat']) * t
    lng = u_attrs['lng'] + (v_attrs['lng'] - u_attrs['lng']) * t
    
    # Simulate realistic speed (slower if congested)
    base_speed = random.gauss(30, 10)  # Mean 30 kmh, std 10
    speed = max(5, min(60, base_speed))  # Clamp 5-60 kmh
    
    ping_id = ingest_ping(
        db_path=db_path,
        device_id=f"SIM_{random.randint(1000, 9999)}",
        lat=lat,
        lng=lng,
        speed_kmh=speed,
        heading=random.uniform(0, 360),
        trip_id=f"SIM_TRIP_{random.randint(100, 999)}"
    )
    
    return {
        "ping_id": ping_id,
        "lat": lat,
        "lng": lng,
        "speed_kmh": speed,
        "route": data.get('route', 'Unknown')
    }