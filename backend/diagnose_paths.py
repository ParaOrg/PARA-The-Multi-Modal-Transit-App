import networkx as nx
import os
import sys
from graph_engine import build_transit_graph

def print_header(title):
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def analyze_global_health(G):
    print_header("🌍 GLOBAL GRAPH HEALTH & ISLAND INSPECTION")
    print(f"Total Nodes: {G.number_of_nodes()}")
    print(f"Total Edges: {G.number_of_edges()}")
    
    if G.number_of_nodes() == 0:
        print("⚠️ CRITICAL: The graph is completely empty!")
        return

    # Get and sort components by size (largest first)
    components = list(nx.weakly_connected_components(G))
    components.sort(key=len, reverse=True)
    
    largest_comp = components[0]
    print(f"Total Connected Components: {len(components)}")
    print(f"Nodes in Largest Component: {len(largest_comp)} ({(len(largest_comp)/G.number_of_nodes())*100:.1f}%)")

    # Calculate Main Network Bounding Box ONCE for efficiency
    main_lats = [G.nodes[n].get('lat') for n in largest_comp if G.nodes[n].get('lat')]
    main_lons = [G.nodes[n].get('lng') for n in largest_comp if G.nodes[n].get('lng')]
    
    if main_lats and main_lons:
        print(f"\n🏙️ Main Network Bounding Box:")
        print(f"   Latitude:  {min(main_lats):.5f} to {max(main_lats):.5f}")
        print(f"   Longitude: {min(main_lons):.5f} to {max(main_lons):.5f}")

    isolated_routes_master = set()

    if len(components) > 1:
        print(f"\n⚠️ WARNING: {len(components) - 1} isolated route islands detected!")
        
        for i, comp in enumerate(components[1:]): # Skip the largest component
            island_routes = set()
            
            # Scan every node in this isolated island to find its routes
            for node in comp:
                for neighbor in G.neighbors(node):
                    route_name = G.edges[node, neighbor].get('route', 'Unknown')
                    if route_name not in ['WALK_TRANSFER', 'WALK_TO_TRANSIT', 'WALK_FROM_TRANSIT']:
                        island_routes.add(route_name)
                for pred in G.predecessors(node):
                    route_name = G.edges[pred, node].get('route', 'Unknown')
                    if route_name not in ['WALK_TRANSFER', 'WALK_TO_TRANSIT', 'WALK_FROM_TRANSIT']:
                        island_routes.add(route_name)
                        
            if island_routes:
                print(f"\n   🔎 Analyzing Island {i+1} ({len(comp)} nodes)...")
                
                # AUTOMATICALLY RUN INSPECT_ISLANDS LOGIC FOR EACH ROUTE
                for route_name in island_routes:
                    print(f"   ❌ DISCONNECTED: {route_name}")
                    isolated_routes_master.add(route_name)
                    
                    # Deep dive into this specific route
                    route_edges = [(u, v, d) for u, v, d in G.edges(data=True) if d.get('route', '').lower() == route_name.lower()]
                    route_nodes = set()
                    for u, v, d in route_edges:
                        route_nodes.add(u)
                        route_nodes.add(v)
                        
                    lats = [G.nodes[n].get('lat') for n in route_nodes if G.nodes[n].get('lat')]
                    lons = [G.nodes[n].get('lng') for n in route_nodes if G.nodes[n].get('lng')]
                    
                    if lats and lons and main_lats and main_lons:
                        print(f"      🗺️ Route Bounds: Lat {min(lats):.4f}-{max(lats):.4f}, Lon {min(lons):.4f}-{max(lons):.4f}")
                        
                        # Check for geographic overlap
                        lat_overlap = not (max(lats) < min(main_lats) or min(lats) > max(main_lats))
                        lon_overlap = not (max(lons) < min(main_lons) or min(lons) > max(main_lons))
                        
                        if lat_overlap and lon_overlap:
                            print(f"      💡 DIAGNOSIS: Overlaps geographically, but lacks 'bridge' routes.")
                            print(f"         -> FIX: Increase transfer radius in graph_engine.py or add missing bridge GeoJSON data.")
                        else:
                            print(f"      💡 DIAGNOSIS: Geographically far from main network (e.g., Provincial/Outside Metro Manila).")
                            print(f"         -> FIX: Normal if your main dataset only covers central Metro Manila.")
                    else:
                        print(f"      ⚠️ Could not calculate coordinates for this route.")
            else:
                print(f"   - Island {i+1} ({len(comp)} nodes) contains stray/unconnected GPS points.")

        if isolated_routes_master:
            print(f"\n🚨 SUMMARY: {len(isolated_routes_master)} routes are DISCONNECTED from the main network.")
    else:
        print("\n✅ PERFECT: The entire graph is 100% connected! No isolated islands.")

    # Check for missing critical properties
    print("\n🔍 Edge Property Audit:")
    missing_weight = missing_time = missing_type = missing_route = 0
    
    for u, v, data in G.edges(data=True):
        if 'routing_weight' not in data: missing_weight += 1
        if 'time_min' not in data: missing_time += 1
        if 'type' not in data: missing_type += 1
        if 'route' not in data: missing_route += 1
        
    if missing_weight > 0: print(f"   ⚠️ {missing_weight} edges missing 'routing_weight'")
    if missing_time > 0: print(f"   ⚠️ {missing_time} edges missing 'time_min'")
    if missing_type > 0: print(f"   ⚠️ {missing_type} edges missing 'type'")
    if missing_route > 0: print(f"   ⚠️ {missing_route} edges missing 'route'")
    
    if missing_weight == missing_time == missing_type == missing_route == 0:
        print("   ✅ All edges have complete properties!")

def analyze_route_health(G, route_name):
    print_header(f"🚐 ROUTE HEALTH: '{route_name}'")
    
    route_edges = [(u, v, d) for u, v, d in G.edges(data=True) 
                   if d.get('route', '').lower() == route_name.lower()]
    
    if not route_edges:
        print(f"❌ Route '{route_name}' NOT FOUND in the graph.")
        return

    print(f"✅ Found {len(route_edges)} edges for this route.")
    
    route_nodes = set()
    for u, v, d in route_edges:
        route_nodes.add(u)
        route_nodes.add(v)
        
    components = list(nx.weakly_connected_components(G))
    components.sort(key=len, reverse=True)
    largest_comp = components[0]
    
    isolated_nodes = [n for n in route_nodes if n not in largest_comp]
    
    if isolated_nodes:
        print(f"⚠️ CRITICAL: {len(isolated_nodes)} nodes of this route are in ISOLATED islands!")
    else:
        print("✅ All nodes in this route are connected to the main network.")

    weights = [d.get('routing_weight', 0) for u, v, d in route_edges]
    avg_weight = sum(weights) / len(weights) if weights else 0
    max_weight = max(weights) if weights else 0
    
    print(f"\n📊 Weight Analysis:")
    print(f"   Average routing_weight: {avg_weight:.2f}")
    print(f"   Max routing_weight: {max_weight:.2f}")
    
    if max_weight > 100:
        print("   ⚠️ WARNING: Some segments have extremely high weights (>100).")

def analyze_node_health(G, node_id):
    print_header(f"📍 NODE HEALTH: '{node_id}'")
    
    if not G.has_node(node_id):
        print(f"❌ Node '{node_id}' does not exist in the graph.")
        return
        
    node_data = G.nodes[node_id]
    print(f"Coordinates: ({node_data.get('lat')}, {node_data.get('lng')})")
    
    in_degree = G.in_degree(node_id)
    out_degree = G.out_degree(node_id)
    print(f"In-degree (roads coming in): {in_degree}")
    print(f"Out-degree (roads going out): {out_degree}")

def main():
    data_dir = "./geojson_data"
    print(f"📂 Checking directory: {os.path.abspath(data_dir)}")
    
    if not os.path.exists(data_dir):
        print(f"❌ Directory {data_dir} does not exist!")
        sys.exit(1)

    print("\n🔧 Loading Transit Graph... (This may take a minute)")
    try:
        G = build_transit_graph(data_dir=data_dir)
        print(f"✅ Graph loaded! Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}\n")
        
        if G.number_of_nodes() == 0:
            print("⚠️ WARNING: The graph is empty.")
            sys.exit(0)
            
    except Exception as e:
        print(f"❌ Failed to load graph: {e}")
        sys.exit(1)

    while True:
        print("\n" + "-"*40)
        print("DIAGNOSTIC MENU")
        print("1. Run Global Health & Auto-Inspect Islands")
        print("2. Check Specific Route Health")
        print("3. Check Specific Node Health")
        print("4. Exit")
        print("-"*40)
        
        choice = input("Select an option (1-4): ").strip()
        
        if choice == '1':
            analyze_global_health(G)
        elif choice == '2':
            route = input("Enter route name to check: ").strip()
            analyze_route_health(G, route)
        elif choice == '3':
            node = input("Enter exact node ID (e.g., '(14.599, 120.984)'): ").strip()
            analyze_node_health(G, node)
        elif choice == '4':
            print("👋 Exiting diagnostics.")
            break
        else:
            print("❌ Invalid choice.")

if __name__ == "__main__":
    main()