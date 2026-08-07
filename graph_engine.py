"""
graph_engine.py — Multi-Modal Transit Routing Engine
Philippines Transit: Jeepneys (loops/one-way), Trains (bidirectional), Buses, UV Express

Data source: Supabase PostGIS (ph_routes, ph_route_shapes, poi_* tables)
"""

import math
import time
import uuid
import networkx as nx
from collections import defaultdict
from typing import Dict, List, Tuple, Optional, Set, Any
import logging
import httpx
import asyncio

# OSRM public server for walking directions
OSRM_WALK_URL = "https://router.project-osrm.org/route/v1/foot/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson"

async def get_walking_path(origin_lat, origin_lng, dest_lat, dest_lng):
    """Get actual walking path from OSRM instead of straight line."""
    url = OSRM_WALK_URL.format(
        lng1=origin_lng, lat1=origin_lat,
        lng2=dest_lng, lat2=dest_lat
    )
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url)
            data = resp.json()
            if data.get("code") == "Ok" and data.get("routes"):
                coords = data["routes"][0]["geometry"]["coordinates"]
                # Flip to [lat, lng] for Leaflet
                return [[c[1], c[0]] for c in coords]
    except Exception:
        pass
    # Fallback: straight line
    return [[origin_lat, origin_lng], [dest_lat, dest_lng]]
import numpy as np
from scipy.spatial import KDTree

from database import supabase

# ============ CONSTANTS ============
SPEED_JEEP_KMH = 25.0
SPEED_BUS_KMH = 30.0
SPEED_TRAIN_KMH = 40.0
SPEED_LRT_KMH = 35.0
SPEED_WALK_KMH = 4.5
TRANSFER_PENALTY_MIN = 5.0

# Fare constants (Philippines 2024)
JEEP_BASE_FARE = 13.0
JEEP_BASE_KM = 4.0
JEEP_PER_KM = 2.5
JEEP_MAX_FARE = 50.0

BUS_BASE_FARE = 15.0
BUS_BASE_KM = 5.0
BUS_PER_KM = 2.5
BUS_MAX_FARE = 60.0

TRAIN_BASE_FARE = 15.0
TRAIN_BASE_KM = 3.0
TRAIN_PER_KM = 2.0
TRAIN_MAX_FARE = 30.0

logging.basicConfig(level=logging.INFO, format='%(name)s:%(levelname)s:%(message)s')
logger = logging.getLogger(__name__)


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lon points"""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ============ CONFIGURATION ============
class GraphConfig:
    """Configuration for transit graph building and routing"""

    def __init__(self,
                 speed_jeep_kmh: float = 25.0,
                 speed_bus_kmh: float = 30.0,
                 speed_train_kmh: float = 40.0,
                 speed_lrt_kmh: float = 35.0,
                 speed_walk_kmh: float = 4.5,
                 transfer_penalty_min: float = 5.0,
                 max_edge_distance_m: float = 1000.0,
                 transfer_radius_m: float = 500.0,
                 enable_transfers: bool = True,
                 transfer_sample_size: int = 50):
        self.speed_jeep_kmh = speed_jeep_kmh
        self.speed_bus_kmh = speed_bus_kmh
        self.speed_train_kmh = speed_train_kmh
        self.speed_lrt_kmh = speed_lrt_kmh
        self.speed_walk_kmh = speed_walk_kmh
        self.transfer_penalty_min = transfer_penalty_min
        self.max_edge_distance_m = max_edge_distance_m
        self.transfer_radius_m = transfer_radius_m
        self.enable_transfers = enable_transfers
        self.transfer_sample_size = transfer_sample_size

    def get_speed(self, vehicle_type: str) -> float:
        """Get speed in km/h for a vehicle type"""
        speed_map = {
            'jeep': self.speed_jeep_kmh,
            'jeepney': self.speed_jeep_kmh,
            'bus': self.speed_bus_kmh,
            'train': self.speed_train_kmh,
            'lrt': self.speed_lrt_kmh,
            'mrt': self.speed_lrt_kmh,
            'uv': self.speed_bus_kmh,
            'uv_express': self.speed_bus_kmh,
        }
        return speed_map.get(vehicle_type, self.speed_jeep_kmh)


# ============ TRANSIT GRAPH BUILDER ============
class TransitGraph:
    """
    Builds a directed transit graph from Supabase PostGIS route data.

    Directionality rules for Philippine transit:
    - Jeepneys: Default ONE-WAY (most are loop routes)
      - If is_bidirectional=True → add reverse edges with 5% penalty
      - If is_loop=True → strictly one-way, no reverse
    - Trains/LRT/MRT: Default BIDIRECTIONAL
      - Same weight in both directions
    - Buses: Check is_bidirectional property
    - UV Express: Usually bidirectional point-to-point
    """

    def __init__(self, config: GraphConfig = None):
        self.config = config or GraphConfig()
        self.graph = nx.DiGraph()

        # Spatial data
        self._node_positions: Dict[str, Tuple[float, float]] = {}
        self._route_nodes: Dict[str, List[str]] = defaultdict(list)
        self._route_names: List[str] = []

        # Spatial index for transfers
        self._kdtree = None
        self._node_list: List[str] = []
        self._node_array = None

        # Track transfer edges to avoid duplicates
        self._transfer_edges: Set[Tuple[str, str]] = set()

        # Stats
        self._stats = {
            'nodes': 0,
            'edges': 0,
            'transfers': 0,
            'build_time': 0,
            'routes': 0,
            'bidirectional_routes': 0,
            'oneway_routes': 0,
        }

    async def build_from_supabase(self) -> nx.DiGraph:
        """Build the complete transit graph from Supabase ph_routes + ph_route_shapes"""
        start = time.time()
        logger.info("🚀 Building transit graph from Supabase...")

        await self._load_all_routes()
        self._build_spatial_index()

        if self.config.enable_transfers:
            self._add_transfer_edges()

        self._stats['build_time'] = time.time() - start
        self._stats['nodes'] = self.graph.number_of_nodes()
        self._stats['edges'] = self.graph.number_of_edges()
        self._stats['routes'] = len(self._route_names)

        logger.info(f"✅ Graph built in {self._stats['build_time']:.2f}s: "
                    f"{self._stats['nodes']} nodes, {self._stats['edges']} edges, "
                    f"{self._stats['routes']} routes")
        logger.info(f"   Bidirectional: {self._stats['bidirectional_routes']}, "
                    f"One-way: {self._stats['oneway_routes']}, "
                    f"Transfers: {self._stats['transfers']}")

        # Attach metadata to graph for routing
        self.graph.graph['_kdtree'] = self._kdtree
        self.graph.graph['_node_list'] = self._node_list
        self.graph.graph['_node_array'] = self._node_array
        self.graph.graph['route_nodes'] = dict(self._route_nodes)
        self.graph.graph['all_nodes'] = dict(self._node_positions)
        self.graph.graph['stats'] = self._stats

        return self.graph

    # ============ SUPABASE DATA LOADING ============

    async def _load_all_routes(self):
        """Load all approved routes and their geometries from Supabase REST API."""
        # Step 1: Get all approved routes
        routes_res = supabase.table("ph_routes").select("*").eq("is_approved", True).order("name").execute()
        routes = routes_res.data or []
        
        if not routes:
            logger.warning("⚠️ No approved routes found in Supabase")
            return
        
        logger.info(f"📂 Fetched {len(routes)} approved routes from Supabase")
        
        # Step 2: For each route, fetch its geometry
        for route in routes:
            route_uuid = route["route_uuid"]
            shape_res = supabase.table("ph_route_shapes").select("geom, length_m, geom_geojson").eq("route_uuid", route_uuid).limit(1).execute()
            shapes = shape_res.data or []
            
            if not shapes:
                continue
            
            shape = shapes[0]
            
            # Build route_data dict matching the old SQL output
            route_data = {
                "route_uuid": route_uuid,
                "name": route.get("name", "unknown"),
                "mode": route.get("mode", "jeepney"),
                "is_loop": route.get("is_loop", False),
                "is_bidirectional": route.get("is_bidirectional", False),
                "is_oneway": route.get("is_oneway", False),
                "geometry_json": shape.get("geom_geojson"),
                "length_m": shape.get("length_m"),
            }
            
            # If no geom_geojson column, try to use geom directly
            if not route_data["geometry_json"]:
                geom = shape.get("geom")
                if geom:
                    # Supabase returns PostGIS geometry as GeoJSON-like dict or WKT string
                    route_data["geometry_json"] = geom
            
            if route_data["geometry_json"]:
                self._process_route_row(route_data)

        logger.info(f"📂 Fetched {len(routes)} approved routes from Supabase")

    def _process_route_row(self, route_data: dict):
        """Process a single route row from Supabase into graph edges"""
        route_name = route_data.get('name', 'unknown')
        vehicle_type = route_data.get('mode', 'jeepney').lower()
        is_loop = route_data.get('is_loop', False)
        is_bidirectional = route_data.get('is_bidirectional', False)
        is_oneway = route_data.get('is_oneway', False)
        geometry_json = route_data.get('geometry_json')

        if not geometry_json:
            return

        # Trains are bidirectional by default
        if vehicle_type in ['train', 'lrt', 'mrt']:
            is_bidirectional = True

        # Loop routes are inherently one-way
        if is_loop:
            is_oneway = True
            is_bidirectional = False

        # Track stats
        if is_bidirectional:
            self._stats['bidirectional_routes'] += 1
        else:
            self._stats['oneway_routes'] += 1

        if route_name not in self._route_nodes:
            self._route_names.append(route_name)

        # Extract coordinates from GeoJSON geometry
        coords_list = self._extract_coords_from_geojson(geometry_json)

        for line_coords in coords_list:
            if len(line_coords) >= 2:
                self._process_line_string(line_coords, route_name, vehicle_type,
                                          oneway=is_oneway, is_bidirectional=is_bidirectional)

    def _extract_coords_from_geojson(self, geometry_json: dict) -> List[List[List[float]]]:
        """Extract coordinate arrays from a GeoJSON geometry object"""
        geom_type = geometry_json.get('type', '')
        coordinates = geometry_json.get('coordinates', [])

        if geom_type == 'MultiLineString':
            return coordinates
        elif geom_type == 'LineString':
            return [coordinates]
        elif geom_type == 'MultiPoint':
            # Treat points as a linestring
            return [coordinates]
        else:
            logger.debug(f"   Unhandled geometry type: {geom_type}")
            return []

    # ============ LINE STRING PROCESSING ============

    def _process_line_string(self, coords: List[List[float]],
                             route_name: str, vehicle_type: str,
                             oneway: bool, is_bidirectional: bool):
        """Convert a line string of coordinates into graph nodes and edges"""
        prev_node = None

        for coord in coords:
            lon, lat = coord[0], coord[1]
            r_lat, r_lon = round(lat, 5), round(lon, 5)

            node_id = f"{route_name}::{r_lat}_{r_lon}"

            # Add node if new
            if node_id not in self._node_positions:
                self._node_positions[node_id] = (r_lat, r_lon)
                self.graph.add_node(node_id, lat=r_lat, lon=r_lon, route=route_name)
                self._route_nodes[route_name].append(node_id)

            # Add edge from previous node
            if prev_node and prev_node != node_id:
                # Determine if reverse edge should be added
                if is_bidirectional:
                    add_reverse = True
                elif vehicle_type in ['train', 'lrt', 'mrt']:
                    add_reverse = True  # Trains always bidirectional
                elif not oneway:
                    add_reverse = True  # Explicitly not oneway
                else:
                    add_reverse = False  # One-way jeepney loop

                self._add_transit_edge(prev_node, node_id, route_name, vehicle_type,
                                       add_reverse=add_reverse)

            prev_node = node_id

    def _add_transit_edge(self, u: str, v: str, route_name: str,
                          vehicle_type: str, add_reverse: bool = False):
        """Add a directed transit edge with optional reverse direction"""
        u_lat, u_lon = self._node_positions[u]
        v_lat, v_lon = self._node_positions[v]
        dist = haversine(u_lat, u_lon, v_lat, v_lon)

        # Skip edges that are too long (likely GPS errors)
        if dist > self.config.max_edge_distance_m:
            return

        speed = self.config.get_speed(vehicle_type)
        time_min = (dist / 1000) / speed * 60
        weight = time_min + (dist / 1000) * 0.5  # Slight distance penalty

        # Forward edge (always added)
        if not self.graph.has_edge(u, v):
            self.graph.add_edge(u, v,
                                distance=dist,
                                time_min=time_min,
                                weight=weight,
                                route=route_name,
                                type=vehicle_type,
                                oneway=not add_reverse)

        # Reverse edge (only for bidirectional routes)
        if add_reverse and not self.graph.has_edge(v, u):
            if vehicle_type in ['train', 'lrt', 'mrt']:
                reverse_weight = weight
            else:
                reverse_weight = weight * 1.05

            self.graph.add_edge(v, u,
                                distance=dist,
                                time_min=time_min,
                                weight=reverse_weight,
                                route=route_name,
                                type=vehicle_type,
                                oneway=False,
                                is_reverse=True)

    # ============ SPATIAL INDEX ============

    def _build_spatial_index(self):
        """Build KD-Tree for fast nearest-neighbor queries"""
        if not self._node_positions:
            logger.warning("⚠️ No nodes to index")
            return

        logger.info("🗺️ Building spatial index...")

        self._node_list = list(self._node_positions.keys())
        positions = np.array([self._node_positions[n] for n in self._node_list])
        self._kdtree = KDTree(positions)
        self._node_array = positions

        logger.info(f"✅ Spatial index built: {len(self._node_list)} nodes")

    # ============ TRANSFER EDGES ============

    def _add_transfer_edges(self):
        """Add walking transfer edges between nearby stops on different routes"""
        if not self._kdtree:
            logger.warning("⚠️ No spatial index for transfers")
            return

        logger.info("🔗 Adding transfer edges...")
        start = time.time()

        route_names = list(self._route_nodes.keys())
        transfer_count = 0

        route_node_sets = {route: set(nodes) for route, nodes in self._route_nodes.items()}

        for i, route_a in enumerate(route_names):
            nodes_a = self._route_nodes[route_a]
            if len(nodes_a) < 2:
                continue

            sampled_a = self._sample_nodes(nodes_a, self.config.transfer_sample_size)

            for route_b in route_names[i + 1:]:
                nodes_b = self._route_nodes[route_b]
                if len(nodes_b) < 2:
                    continue

                pairs = self._find_nearby_pairs(
                    sampled_a, route_node_sets[route_b],
                    self.config.transfer_radius_m, max_pairs=3
                )

                for node_a, node_b, dist in pairs:
                    self._add_single_transfer(node_a, node_b, dist)
                    transfer_count += 1

        self._stats['transfers'] = transfer_count
        elapsed = time.time() - start
        logger.info(f"✅ Added {transfer_count} transfers in {elapsed:.2f}s")

    def _sample_nodes(self, nodes: List[str], max_samples: int) -> List[str]:
        """Sample nodes evenly along a route"""
        if len(nodes) <= max_samples:
            return nodes
        step = max(1, len(nodes) // max_samples)
        return nodes[::step][:max_samples]

    def _find_nearby_pairs(self, nodes_a: List[str], nodes_b_set: Set[str],
                           radius: float, max_pairs: int) -> List[Tuple[str, str, float]]:
        """Find pairs of nodes from two routes that are within radius meters"""
        if not nodes_a or not nodes_b_set or not self._kdtree:
            return []

        pairs = []
        used_b = set()

        points_a = []
        nodes_a_filtered = []
        for node in nodes_a[:20]:
            if node in self._node_positions:
                lat, lon = self._node_positions[node]
                points_a.append([lat, lon])
                nodes_a_filtered.append(node)

        if not points_a:
            return []

        points = np.array(points_a)
        k = min(10, len(self._node_list))
        distances, indices = self._kdtree.query(points, k=k)

        for i, node_a in enumerate(nodes_a_filtered):
            if len(pairs) >= max_pairs:
                break

            for j in range(k):
                dist = distances[i][j] if k > 1 else distances[i]
                idx = indices[i][j] if k > 1 else indices[i]

                if dist > radius:
                    continue

                node_b = self._node_list[idx]
                if node_b in nodes_b_set and node_b not in used_b:
                    pairs.append((node_a, node_b, float(dist)))
                    used_b.add(node_b)
                    break

        return pairs

    def _add_single_transfer(self, node_a: str, node_b: str, dist: float):
        """Add a bidirectional walking transfer between two nodes"""
        if dist > 500:
            return

        edge_key = tuple(sorted([node_a, node_b]))
        if edge_key in self._transfer_edges:
            return

        route_a = self.graph.nodes[node_a].get('route', '')
        route_b = self.graph.nodes[node_b].get('route', '')
        if route_a == route_b:
            return

        walk_time = (dist / 1000) / SPEED_WALK_KMH * 60
        weight = walk_time + self.config.transfer_penalty_min

        for u, v in [(node_a, node_b), (node_b, node_a)]:
            if not self.graph.has_edge(u, v):
                self.graph.add_edge(u, v,
                                    distance=dist,
                                    time_min=walk_time,
                                    weight=weight,
                                    route="WALK_TRANSFER",
                                    type="walk",
                                    is_transfer=True)

        self._transfer_edges.add(edge_key)


# ============ ROUTE FINDING ============

def find_route(G: nx.DiGraph, origin_lat: float, origin_lon: float,
               dest_lat: float, dest_lon: float) -> Optional[Dict]:
    """
    Find the optimal multi-modal route between two points.

    Returns a dict with segments, total time, total fare, and geometry.
    """
    node_positions = G.graph.get('all_nodes', {})
    if not node_positions:
        logger.error("❌ No node positions in graph")
        return None

    G_copy = G.copy()

    origin_node = _connect_virtual_node(G_copy, origin_lat, origin_lon, "ORIGIN", node_positions)
    dest_node = _connect_virtual_node(G_copy, dest_lat, dest_lon, "DEST", node_positions)

    if not origin_node or not dest_node:
        logger.warning("⚠️ Could not connect origin or destination")
        return None

    try:
        path = nx.dijkstra_path(G_copy, origin_node, dest_node, weight='weight')
        route = _extract_route_segments(G_copy, path)
        return route
    except nx.NetworkXNoPath:
        logger.warning("⚠️ No path found between origin and destination")
        return None
    finally:
        for node in [origin_node, dest_node]:
            if node and G_copy.has_node(node):
                G_copy.remove_node(node)


def _connect_virtual_node(G: nx.DiGraph, lat: float, lon: float,
                          label: str, node_positions: Dict) -> Optional[str]:
    """Connect a virtual point to the K=3 nearest nodes for robust short-distance routing"""
    import heapq

    nearest_nodes = []
    for node_id, (n_lat, n_lon) in node_positions.items():
        dist = haversine(lat, lon, n_lat, n_lon)
        if dist < 5000:
            heapq.heappush(nearest_nodes, (dist, node_id))

    if not nearest_nodes:
        return None

    top_nodes = heapq.nsmallest(3, nearest_nodes)
    primary_dist, primary_node = top_nodes[0]

    virtual_id = f"VIRTUAL_{label}_{uuid.uuid4().hex[:8]}"
    G.add_node(virtual_id, lat=lat, lon=lon, route="virtual", is_virtual=True)

    for rank, (dist, node) in enumerate(top_nodes):
        walk_time = (dist / 1000) / SPEED_WALK_KMH * 60
        penalty = 0 if rank == 0 else 3.0 * rank
        weight = walk_time + TRANSFER_PENALTY_MIN + penalty

        if label == "ORIGIN":
            if not G.has_edge(virtual_id, node):
                G.add_edge(virtual_id, node,
                           distance=dist, time_min=walk_time, weight=weight,
                           route="WALK_TO_ROUTE", type="walk")
        else:
            if not G.has_edge(node, virtual_id):
                G.add_edge(node, virtual_id,
                           distance=dist, time_min=walk_time, weight=weight,
                           route="WALK_TO_DEST", type="walk")

    return virtual_id


def _extract_route_segments(G: nx.DiGraph, path: List[str]) -> Optional[Dict]:
    """Extract and merge route segments from a graph path"""
    if not path or len(path) < 2:
        return None

    raw_segments = []
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        if not G.has_edge(u, v):
            continue

        edge = G.edges[u, v]
        u_lat, u_lon = G.nodes[u].get('lat', 0), G.nodes[u].get('lon', 0)
        v_lat, v_lon = G.nodes[v].get('lat', 0), G.nodes[v].get('lon', 0)

        raw_segments.append({
            'route': edge.get('route', 'unknown'),
            'type': edge.get('type', 'unknown'),
            'is_transfer': edge.get('is_transfer', False),
            'distance_m': edge.get('distance', 0),
            'time_min': edge.get('time_min', 0),
            'from_node': u,
            'to_node': v,
            'from_coords': [u_lon, u_lat],
            'to_coords': [v_lon, v_lat],
        })

    if not raw_segments:
        return None

    merged = []
    current = None

    for seg in raw_segments:
        if current is None:
            current = seg.copy()
            current['geometry'] = [current['from_coords'], current['to_coords']]
        elif (_can_merge(current, seg)):
            current['distance_m'] += seg['distance_m']
            current['time_min'] += seg['time_min']
            current['to_node'] = seg['to_node']
            current['to_coords'] = seg['to_coords']
            current['geometry'].append(seg['to_coords'])
        else:
            merged.append(current)
            current = seg.copy()
            current['geometry'] = [current['from_coords'], current['to_coords']]

    if current:
        merged.append(current)

    for seg in merged:
        seg['fare'] = _calculate_fare(
            seg.get('type', ''),
            seg.get('distance_m', 0),
            seg.get('is_transfer', False)
        )

    total_time = sum(s.get('time_min', 0) for s in merged)
    total_distance = sum(s.get('distance_m', 0) for s in merged)
    total_fare = sum(s.get('fare', 0) for s in merged)

    segments = []
    for seg in merged:
        dist_m = round(seg.get('distance_m', 0), 1)
        # Format distance: show km if >= 1000m
        distance_display = f"{dist_m/1000:.1f} km" if dist_m >= 1000 else f"{dist_m:.0f} m"
        segments.append({
            'from': seg.get('from_node', ''),
            'to': seg.get('to_node', ''),
            'route': seg.get('route', ''),
            'type': seg.get('type', ''),
            'is_transfer': seg.get('is_transfer', False),
            'distance_m': dist_m,
            'distance_display': distance_display,
            'time_min': round(seg.get('time_min', 0), 1),
            'fare': round(seg.get('fare', 0), 1),
            'geometry': seg.get('geometry', [])
        })

    # Filter out zero-distance transfer segments
    segments = [s for s in segments if not (s.get('is_transfer') and s.get('distance_m', 0) <= 0)]
    
    return {
        'path': path,
        'segments': segments,
        'total_time_min': round(total_time, 1),
        'total_distance_m': round(total_distance, 1),
        'total_fare': round(total_fare, 1),
        'message': f"{total_time:.0f} mins, ₱{total_fare:.0f}"
    }


def _can_merge(current: Dict, next_seg: Dict) -> bool:
    """Check if two consecutive segments can be merged"""
    # Merge consecutive walk/transfer segments into one continuous walk
    if current.get('is_transfer') and next_seg.get('is_transfer'):
        return True
    # Merge same route, same type, non-transfer segments
    return (
        next_seg['route'] == current['route'] and
        next_seg['type'] == current['type'] and
        not next_seg['is_transfer'] and
        not current['is_transfer']
    )


def _calculate_fare(vehicle_type: str, distance_m: float, is_transfer: bool) -> float:
    """Calculate fare based on vehicle type and distance (Philippines 2024 rates)"""
    if is_transfer or vehicle_type == 'walk':
        return 0.0

    dist_km = distance_m / 1000

    if vehicle_type in ['jeep', 'jeepney']:
        if dist_km <= JEEP_BASE_KM:
            return JEEP_BASE_FARE
        return min(JEEP_BASE_FARE + (dist_km - JEEP_BASE_KM) * JEEP_PER_KM, JEEP_MAX_FARE)

    elif vehicle_type == 'bus':
        if dist_km <= BUS_BASE_KM:
            return BUS_BASE_FARE
        return min(BUS_BASE_FARE + (dist_km - BUS_BASE_KM) * BUS_PER_KM, BUS_MAX_FARE)

    elif vehicle_type in ['train', 'lrt', 'mrt']:
        if dist_km <= TRAIN_BASE_KM:
            return TRAIN_BASE_FARE
        return min(TRAIN_BASE_FARE + (dist_km - TRAIN_BASE_KM) * TRAIN_PER_KM, TRAIN_MAX_FARE)

    else:
        return JEEP_BASE_FARE




def find_k_routes(G, origin_lat: float, origin_lon: float,
                  dest_lat: float, dest_lon: float, k: int = 3) -> List[Dict]:
    """
    Find K alternative routes using Yen's K-shortest paths algorithm.
    Returns up to K distinct routes with different characteristics.
    """
    node_positions = G.graph.get('all_nodes', {})
    if not node_positions:
        return []
    
    G_copy = G.copy()
    origin_node = _connect_virtual_node(G_copy, origin_lat, origin_lon, "ORIGIN", node_positions)
    dest_node = _connect_virtual_node(G_copy, dest_lat, dest_lon, "DEST", node_positions)
    
    if not origin_node or not dest_node:
        return []
    
    routes = []
    
    try:
        # Use NetworkX's built-in shortest_simple_paths for K-shortest
        # This is more efficient than Yen's for moderate K values
        from itertools import islice
        
        # Try different weight strategies for variety
        strategies = [
            ("fastest", "weight"),      # Standard time-based weight
            ("fewest_transfers", None), # Fewest edges = fewest transfers
        ]
        
        for strategy_name, weight_attr in strategies:
            try:
                if weight_attr:
                    paths = nx.shortest_simple_paths(G_copy, origin_node, dest_node, weight=weight_attr)
                else:
                    # Fewest edges — use unweighted BFS
                    paths = nx.shortest_simple_paths(G_copy, origin_node, dest_node)
                
                # Take up to 2 paths per strategy
                for path in islice(paths, 2):
                    route = _extract_route_segments(G_copy, path)
                    if route and not _is_duplicate_route(route, routes):
                        route["strategy"] = strategy_name
                        routes.append(route)
                    if len(routes) >= k:
                        break
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue
            
            if len(routes) >= k:
                break
    
    except Exception as e:
        logger.warning(f"K-shortest paths error: {e}")
    
    # Clean up virtual nodes
    for node in [origin_node, dest_node]:
        if node and G_copy.has_node(node):
            G_copy.remove_node(node)
    
    # If we got fewer than K, duplicate with different strategies
    if len(routes) == 1 and k > 1:
        # Add a "fewest transfers" variant if possible
        routes.append({**routes[0], "strategy": "balanced"})
    
    return routes[:k]


def _is_duplicate_route(route: Dict, existing: List[Dict]) -> bool:
    """Check if a route is too similar to any existing route."""
    new_segs = [s.get("route", "") for s in route.get("segments", [])]
    for ex in existing:
        ex_segs = [s.get("route", "") for s in ex.get("segments", [])]
        if new_segs == ex_segs:
            return True
    return False


# ============ MAIN BUILD FUNCTION ============

async def build_transit_graph() -> nx.DiGraph:
    """Build a transit graph from Supabase ph_routes + ph_route_shapes"""
    config = GraphConfig(
        transfer_radius_m=500.0,
        max_edge_distance_m=1000.0,
        transfer_sample_size=50
    )
    builder = TransitGraph(config)
    return await builder.build_from_supabase()


# ============ EXPORTS ============
__all__ = [
    'build_transit_graph',
    'find_route',
    'find_k_routes',
    'haversine',
    'TransitGraph',
    'GraphConfig',
    'SPEED_JEEP_KMH',
    'SPEED_WALK_KMH',
]
