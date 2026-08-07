import json
import os

def inspect_geojson_files():
    data_dir = "./geojson_data"
    print(f"🔍 Inspecting files in {data_dir}...\n")
    
    for file in os.listdir(data_dir):
        if file.endswith(".geojson"):
            filepath = os.path.join(data_dir, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    features = data.get("features", [])
                    if not features:
                        print(f"📄 {file}: Empty file")
                        continue
                        
                    # Check the first feature to determine geometry type
                    first_geom = features[0].get("geometry", {}).get("type", "Unknown")
                    first_props = features[0].get("properties", {})
                    
                    print(f"📄 {file}")
                    print(f"   ├─ Total Features: {len(features)}")
                    print(f"   ├─ Geometry Type: {first_geom}")
                    print(f"   └─ Sample Properties: {first_props}")
                    print("-" * 40)
                except Exception as e:
                    print(f"❌ Error reading {file}: {e}")

if __name__ == "__main__":
    inspect_geojson_files()