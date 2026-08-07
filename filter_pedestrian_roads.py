import json
import os
import sys

def filter_pedestrian_roads(input_file, output_file):
    """
    Filters a large Philippine roads GeoJSON to extract only:
    1. highway: footway, path, pedestrian
    2. bridge: yes, boardwalk, suspension
    3. Within Metro Manila bounding box
    """
    
    # Metro Manila Bounding Box (slightly expanded from your graph data)
    MM_MIN_LAT = 14.50
    MM_MAX_LAT = 14.75
    MM_MIN_LON = 120.93
    MM_MAX_LON = 121.13
    
    print(f" Filtering walking paths and bridges in Metro Manila...")
    print(f"📍 Bounding Box:")
    print(f"   Lat: {MM_MIN_LAT} to {MM_MAX_LAT}")
    print(f"   Lon: {MM_MIN_LON} to {MM_MAX_LON}")
    print(f"\n📂 Input: {input_file}")
    print(f" Output: {output_file}")
    
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file '{input_file}' not found!")
        sys.exit(1)
    
    total_features = 0
    valid_features = 0
    mm_features = 0
    final_features = 0
    
    print("\n⏳ Processing GeoJSON (this may take a few minutes for large files)...")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        print(f"✅ Loaded GeoJSON successfully")
        print(f" Total features in file: {len(data.get('features', []))}")
        
        filtered_features = []
        
        for i, feature in enumerate(data.get('features', [])):
            total_features += 1
            
            # Progress indicator every 10,000 features
            if i % 10000 == 0 and i > 0:
                print(f"   Processed {i:,} features...")
            
            # Check properties for the requested tags
            props = feature.get('properties', {})
            highway_type = props.get('highway', '')
            bridge_type = props.get('bridge', '')
            
            # THE FIX: Strictly check for the requested tags
            is_valid_highway = highway_type in ['footway', 'path', 'pedestrian']
            is_valid_bridge = bridge_type in ['yes', 'boardwalk', 'suspension']
            
            # If it's neither a valid walking path nor a bridge, skip it
            if not (is_valid_highway or is_valid_bridge):
                continue
                
            valid_features += 1
            
            # Check geometry type and extract coordinates
            geom = feature.get('geometry', {})
            geom_type = geom.get('type', '')
            coords = geom.get('coordinates', [])
            
            if not coords:
                continue
            
            # Bounding box check based on geometry type
            is_in_mm = False
            
            if geom_type == 'LineString':
                for coord in coords:
                    lon, lat = coord[0], coord[1]
                    if (MM_MIN_LAT <= lat <= MM_MAX_LAT and 
                        MM_MIN_LON <= lon <= MM_MAX_LON):
                        is_in_mm = True
                        break
                        
            elif geom_type == 'MultiLineString':
                for line in coords:
                    for coord in line:
                        lon, lat = coord[0], coord[1]
                        if (MM_MIN_LAT <= lat <= MM_MAX_LAT and 
                            MM_MIN_LON <= lon <= MM_MAX_LON):
                            is_in_mm = True
                            break
                    if is_in_mm:
                        break
            
            elif geom_type == 'Point':
                lon, lat = coords[0], coords[1]
                is_in_mm = (MM_MIN_LAT <= lat <= MM_MAX_LAT and 
                           MM_MIN_LON <= lon <= MM_MAX_LON)
            
            if not is_in_mm:
                continue
                
            mm_features += 1
            
            # Filter out invalid/empty geometries
            if geom_type in ['LineString', 'MultiLineString']:
                if geom_type == 'LineString' and len(coords) < 2:
                    continue
                elif geom_type == 'MultiLineString' and all(len(line) < 2 for line in coords):
                    continue
            
            final_features += 1
            filtered_features.append(feature)
        
        # Create output GeoJSON
        output_data = {
            "type": "FeatureCollection",
            "features": filtered_features
        }
        
        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
            
        print("\n" + "="*60)
        print("✅ FILTERING COMPLETE!")
        print("="*60)
        print(f"📊 Statistics:")
        print(f"   Total features scanned: {total_features:,}")
        print(f"   Valid paths/bridges found: {valid_features:,}")
        print(f"   Inside Metro Manila: {mm_features:,}")
        print(f"   Final output features: {final_features:,}")
        print(f"\n💾 Saved to: {output_file}")
        print(f"\n💡 Next step: Move this file to ./geojson_data/")
        
    except json.JSONDecodeError as e:
        print(f" Error: Invalid JSON format - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

def main():
    print("="*60)
    print("🚶 METRO MANILA WALKING PATH & BRIDGE FILTER")
    print("="*60)
    
    # Default file names
    input_file = input("\n📁 Enter input GeoJSON file path (or press Enter for 'philippines_roads.geojson'): ").strip()
    if not input_file:
        input_file = "philippines_roads.geojson"
    
    output_file = input("📄 Enter output file name (or press Enter for 'manila_walking_paths.geojson'): ").strip()
    if not output_file:
        output_file = "manila_walking_paths.geojson"
    
    filter_pedestrian_roads(input_file, output_file)

if __name__ == "__main__":
    main()