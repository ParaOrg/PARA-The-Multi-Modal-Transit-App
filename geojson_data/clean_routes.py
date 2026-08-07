"""Clean all GeoJSON routes: single direction, ordered, no teleportation."""
import json, math, sys

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for feat in data.get('features', []):
        props = feat.get('properties', {})
        geom = feat.get('geometry', {})
        
        # Get coords
        if geom.get('type') == 'MultiLineString':
            coords = geom['coordinates'][0]
        else:
            coords = geom.get('coordinates', [])
        
        if len(coords) < 2:
            continue
        
        # Remove teleportation gaps (>500m)
        cleaned = [coords[0]]
        for i in range(1, len(coords)):
            prev = cleaned[-1]
            curr = coords[i]
            dist = haversine(prev[1], prev[0], curr[1], curr[0])
            if dist < 500:
                cleaned.append(curr)
            else:
                print(f"  ⚠️ Removed gap at point {i}: {dist:.0f}m in {props.get('route_long_name','?')}")
        
        # Set back
        if geom.get('type') == 'MultiLineString':
            geom['coordinates'][0] = cleaned
        else:
            geom['coordinates'] = cleaned
        
        # Remove bidirectional/loop flags
        props.pop('bidirectional', None)
        props.pop('loop', None)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Cleaned: {filepath}")

if __name__ == '__main__':
    for f in sys.argv[1:] or ['1routes.geojson', 'routes.geojson']:
        clean_file(f)