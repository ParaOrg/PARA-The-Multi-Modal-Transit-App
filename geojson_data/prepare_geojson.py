#!/usr/bin/env python3
"""
prepare_geojson.py - Standardize GeoJSON route files for Para PH

Ensures all route files have consistent property names regardless of vehicle type:
  jeep, bus, train, lrt, mrt, uv_express, ferry

Usage:
  python prepare_geojson.py <input.geojson> [output.geojson]
  python prepare_geojson.py routes.geojson              # Overwrites with backup
  python prepare_geojson.py --all /path/to/geojson_data/ # Process all files
  python prepare_geojson.py --undo routes.geojson        # Restore backup
"""

import json
import math
import os
import sys
import shutil
import glob
from datetime import datetime
from pathlib import Path


def haversine(lat1, lon1, lat2, lon2):
    """Distance in meters between two lat/lon points"""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ============ STANDARD PROPERTY SCHEMA ============
# Every route feature should have these properties:
STANDARD_PROPERTIES = {
    # Required - filled by script if missing
    "type": "jeep",           # Vehicle type: jeep, bus, train, lrt, mrt, uv_express, ferry
    "mode": "jeep",           # Same as type (for compatibility)
    "bidirectional": False,   # True for trains, point-to-point UV/bus
    "loop": False,            # True for circular jeepney routes
    "oneway": False,          # True if strictly one-direction only
    
    # Optional but recommended
    "route_name": "",         # Short name (e.g., "UP - IKOT")
    "route_long_name": "",    # Full name (e.g., "UP Campus - IKOT Loop")
    "route_id": None,         # External ID if available
    "operator": "",           # Operator company
    "last_updated": "",       # ISO date string
    "notes": "",              # Any notes
}

# Speed defaults per vehicle type (km/h)
VEHICLE_SPEEDS = {
    "jeep": 25.0,
    "jeepney": 25.0,
    "bus": 30.0,
    "train": 40.0,
    "lrt": 35.0,
    "mrt": 35.0,
    "uv_express": 35.0,
    "uv": 30.0,
    "ferry": 20.0,
}

# Directionality defaults per vehicle type
VEHICLE_BIDIRECTIONAL_DEFAULTS = {
    "jeep": False,        # Most jeepneys are loops
    "jeepney": False,
    "bus": True,          # Most buses go both ways
    "train": True,        # Trains always bidirectional
    "lrt": True,
    "mrt": True,
    "uv_express": True,   # UV Express is point-to-point
    "uv": True,
    "ferry": True,
}


def detect_vehicle_type(feature, filename=""):
    """Detect vehicle type from properties or filename"""
    props = feature.get("properties", {})
    
    # Check existing type field
    existing_type = props.get("type", "").lower().strip()
    if existing_type in VEHICLE_SPEEDS:
        return existing_type
    
    # Check mode field
    existing_mode = props.get("mode", "").lower().strip()
    if existing_mode in VEHICLE_SPEEDS:
        return existing_mode
    
    # Try to detect from filename
    name_lower = filename.lower()
    if "train" in name_lower or "pnr" in name_lower:
        return "train"
    if "lrt" in name_lower:
        return "lrt"
    if "mrt" in name_lower:
        return "mrt"
    if "bus" in name_lower:
        return "bus"
    if "uv" in name_lower or "express" in name_lower:
        return "uv_express"
    if "ferry" in name_lower or "pasig" in name_lower:
        return "ferry"
    
    # Default: jeepney
    return "jeep"


def detect_loop(feature):
    """Detect if a route is a loop (start ≈ end)"""
    geom = feature.get("geometry", {})
    coords = geom.get("coordinates", [])
    
    # Handle MultiLineString - use first line
    if geom.get("type") == "MultiLineString" and coords:
        coords = coords[0]
    
    if len(coords) < 3:
        return False
    
    first = coords[0]
    last = coords[-1]
    dist = haversine(last[1], last[0], first[1], first[0])
    
    return dist < 100  # Within 100m = loop


def standardize_feature(feature, filename=""):
    """
    Standardize a single GeoJSON feature to have all required properties.
    Returns the modified feature.
    """
    props = feature.setdefault("properties", {})
    
    # 1. Detect and set vehicle type
    vehicle_type = detect_vehicle_type(feature, filename)
    props["type"] = vehicle_type
    props["mode"] = vehicle_type  # Keep mode in sync
    
    # 2. Detect loop
    is_loop = detect_loop(feature)
    
    # 3. Set directionality based on vehicle type and loop detection
    if "bidirectional" not in props:
        # Use default for this vehicle type
        default_bidir = VEHICLE_BIDIRECTIONAL_DEFAULTS.get(vehicle_type, False)
        # But if it's a loop, override to False
        if is_loop:
            props["bidirectional"] = False
        else:
            props["bidirectional"] = default_bidir
    
    if "loop" not in props:
        props["loop"] = is_loop
    
    if "oneway" not in props:
        # One-way if it's a loop OR explicitly marked oneway
        props["oneway"] = is_loop or props.get("bidirectional", False) == False
    
    # 4. Ensure route name
    if "route_name" not in props or not props["route_name"]:
        props["route_name"] = props.get("route_long_name", "") or props.get("name", "") or ""
    
    if "route_long_name" not in props or not props["route_long_name"]:
        props["route_long_name"] = props.get("route_name", "") or props.get("name", "") or ""
    
    # 5. Set defaults for optional fields
    for key, default in STANDARD_PROPERTIES.items():
        if key not in props:
            props[key] = default
    
    # 6. Add speed info (for reference, not used by graph engine directly)
    if "speed_kmh" not in props:
        props["speed_kmh"] = VEHICLE_SPEEDS.get(vehicle_type, 25.0)
    
    return feature


def standardize_geojson(input_file: str, output_file: str = None):
    """
    Standardize all features in a GeoJSON file.
    
    Args:
        input_file: Path to input GeoJSON
        output_file: Path to output (defaults to overwriting input with backup)
    """
    if output_file is None:
        backup_geojson(input_file)
        output_file = input_file
    
    print(f"📂 Processing: {os.path.basename(input_file)}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    filename = os.path.basename(input_file)
    features = data.get("features", [])
    
    stats = {
        "total": len(features),
        "jeep": 0, "bus": 0, "train": 0, "lrt": 0, "mrt": 0,
        "uv_express": 0, "ferry": 0, "other": 0,
        "loops": 0, "bidirectional": 0, "oneway": 0
    }
    
    for feature in features:
        feature = standardize_feature(feature, filename)
        props = feature.get("properties", {})
        
        # Count stats
        vtype = props.get("type", "other")
        if vtype in stats:
            stats[vtype] += 1
        else:
            stats["other"] += 1
        
        if props.get("loop"):
            stats["loops"] += 1
        if props.get("bidirectional"):
            stats["bidirectional"] += 1
        if props.get("oneway"):
            stats["oneway"] += 1
    
    # Update metadata
    data.setdefault("metadata", {})
    data["metadata"]["standardized"] = datetime.now().isoformat()
    data["metadata"]["processor"] = "prepare_geojson.py v2.0"
    data["metadata"]["stats"] = stats
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    # Print summary
    print(f"   ✅ {stats['total']} features standardized")
    print(f"   🚐 Jeep: {stats['jeep']}  🚌 Bus: {stats['bus']}  🚆 Train: {stats['train']}")
    print(f"   🚊 LRT: {stats['lrt']}  🚝 MRT: {stats['mrt']}  🚙 UV: {stats['uv_express']}")
    print(f"   🔄 Loops: {stats['loops']}  ↔️ Bidirectional: {stats['bidirectional']}  ➡️ One-way: {stats['oneway']}")
    print(f"   💾 Saved: {output_file}")
    
    return stats


def process_all_in_directory(directory: str):
    """Standardize all GeoJSON files in a directory"""
    geojson_files = sorted(Path(directory).glob("*.geojson"))
    
    # Filter out backups
    geojson_files = [f for f in geojson_files if ".bak." not in str(f)]
    
    if not geojson_files:
        print(f"❌ No .geojson files found in {directory}")
        return
    
    print(f"\n{'='*60}")
    print(f"🔄 Processing {len(geojson_files)} GeoJSON files in {directory}")
    print(f"{'='*60}\n")
    
    total_stats = {}
    for filepath in geojson_files:
        stats = standardize_geojson(str(filepath))
        for k, v in stats.items():
            total_stats[k] = total_stats.get(k, 0) + v
        print()
    
    print(f"{'='*60}")
    print(f"📊 TOTAL: {total_stats.get('total', 0)} features across {len(geojson_files)} files")
    print(f"{'='*60}")


def backup_geojson(input_file: str) -> str:
    """Create a timestamped backup before modifying"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup = f"{input_file}.bak.{timestamp}"
    shutil.copy(input_file, backup)
    print(f"   📦 Backup: {os.path.basename(backup)}")
    return backup


def undo_last(input_file: str):
    """Restore the most recent backup"""
    backups = sorted(glob.glob(f"{input_file}.bak.*"), reverse=True)
    if not backups:
        print(f"❌ No backups found for {input_file}")
        return
    latest = backups[0]
    shutil.copy(latest, input_file)
    print(f"↩️  Restored: {os.path.basename(latest)} -> {os.path.basename(input_file)}")


def reverse_route(input_file: str, route_name: str, output_file: str = None):
    """Reverse the coordinate order of a specific route by name"""
    if output_file is None:
        backup_geojson(input_file)
        output_file = input_file
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    found = False
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        name = props.get("route_name", "") or props.get("route_long_name", "") or props.get("name", "")
        
        if route_name.lower() in name.lower():
            geom = feature.get("geometry", {})
            if geom.get("type") == "MultiLineString":
                for i, line in enumerate(geom["coordinates"]):
                    geom["coordinates"][i] = list(reversed(line))
            elif geom.get("type") == "LineString":
                geom["coordinates"] = list(reversed(geom["coordinates"]))
            
            # Flip directionality flags
            props["reversed"] = True
            props["notes"] = props.get("notes", "") + " [Reversed]"
            
            found = True
            print(f"🔄 Reversed: {name}")
    
    if not found:
        print(f"❌ Route '{route_name}' not found")
        return
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"💾 Saved: {output_file}")


def validate_geojson(input_file: str):
    """Validate a GeoJSON file has all required properties"""
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    issues = []
    features = data.get("features", [])
    
    for i, feature in enumerate(features):
        props = feature.get("properties", {})
        prefix = f"Feature {i}"
        
        if "type" not in props:
            issues.append(f"{prefix}: missing 'type'")
        if "bidirectional" not in props:
            issues.append(f"{prefix}: missing 'bidirectional'")
        if "loop" not in props:
            issues.append(f"{prefix}: missing 'loop'")
        
        geom = feature.get("geometry", {})
        if "coordinates" not in geom:
            issues.append(f"{prefix}: missing coordinates")
    
    if issues:
        print(f"❌ {len(issues)} issues found in {input_file}:")
        for issue in issues[:10]:
            print(f"   - {issue}")
    else:
        print(f"✅ {input_file}: {len(features)} features valid")


# ============ CLI ============
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        print("Usage:")
        print("  python prepare_geojson.py <input.geojson> [output.geojson]")
        print("  python prepare_geojson.py --all <directory>")
        print("  python prepare_geojson.py --validate <file.geojson>")
        print("  python prepare_geojson.py --reverse <file.geojson> <route_name>")
        print("  python prepare_geojson.py --undo <file.geojson>")
        sys.exit(0)
    
    if sys.argv[1] == "--all":
        directory = sys.argv[2] if len(sys.argv) > 2 else "."
        process_all_in_directory(directory)
    
    elif sys.argv[1] == "--validate":
        validate_geojson(sys.argv[2])
    
    elif sys.argv[1] == "--reverse":
        if len(sys.argv) < 4:
            print("Usage: python prepare_geojson.py --reverse <file.geojson> <route_name>")
            sys.exit(1)
        reverse_route(sys.argv[2], sys.argv[3])
    
    elif sys.argv[1] == "--undo":
        undo_last(sys.argv[2] if len(sys.argv) > 2 else "routes.geojson")
    
    else:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        standardize_geojson(input_file, output_file)