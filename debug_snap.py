import networkx as nx
from graph_engine import build_transit_graph, haversine, SPEED_WALK_KMH

def main():
    print("🔧 Loading graph...")
    G = build_transit_graph("./geojson_data")
    
    # Coordinates
    o_lat, o_lng = 14.6398984, 121.0781952 # Ateneo
    d_lat, d_lng = 14.6194837, 121.0510726 # Cubao
    
    src_id = "DEBUG_SRC"
    tgt_id = "DEBUG_TGT"
    G.add_node(src_id, lat=o_lat, lng=o_lng)
    G.add_node(tgt_id, lat=d_lat, lng=d_lng)
    
    # Helper to find closest nodes
    def find_closest(lat, lng, limit=5):
        spatial_grid = G.graph.get('spatial_grid', {})
        grid_size = G.graph.get('grid_size', 0.0005)
        gx, gy = int(lat / grid_size), int(lng / grid_size)
        
        candidates = []
        for dx in [-2, -1, 0, 1, 2]:
            for dy in [-2, -1, 0, 1, 2]:
                for node in spatial_grid.get((gx + dx, gy + dy), []):
                    node_attrs = G.nodes[node]
                    dist = haversine(lat, lng, node_attrs['lat'], node_attrs['lng'])
                    if dist < 2500:
                        candidates.append((node, dist, node_attrs.get('lat'), node_attrs.get('lng')))
        
        candidates.sort(key=lambda x: x[1])
        return candidates[:limit]

    print("\n📍 ATENEO (START) SNAPPING CANDIDATES:")
    for node, dist, lat, lng in find_closest(o_lat, o_lng):
        # Check what routes are connected to this node
        routes = set()
        for neighbor in G.neighbors(node):
            r = G.edges[node, neighbor].get('route', 'Unknown')
            if 'WALK' not in r: routes.add(r)
        print(f"   Node: {node} | Dist: {dist:.0f}m | Routes: {', '.join(routes)}")

    print("\n🏁 CUBAO (END) SNAPPING CANDIDATES:")
    for node, dist, lat, lng in find_closest(d_lat, d_lng):
        routes = set()
        for neighbor in G.neighbors(node):
            r = G.edges[node, neighbor].get('route', 'Unknown')
            if 'WALK' not in r: routes.add(r)
        print(f"   Node: {node} | Dist: {dist:.0f}m | Routes: {', '.join(routes)}")

if __name__ == "__main__":
    main()