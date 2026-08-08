import json
import sqlite3
import os

def ingest_pois():
    db = sqlite3.connect("para_poi.db")
    cursor = db.cursor()
    
    # 1. Create the main table for coordinates
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category TEXT,
            lat REAL,
            lon REAL
        )
    """)
    
    # 2. Create the FTS5 Virtual Table for lightning-fast search
    # This is the "Pro Plugin" magic. It indexes words, handles partial matches, and ranks them.
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS poi_search USING fts5(
            id, 
            name, 
            category, 
            tokenize='porter unicode61' /* Handles punctuation and basic stemming */
        )
    """)
    db.commit()

    data_dir = "./geojson_data"
    files_to_process = ["POI.geojson", "schools.geojson"]
    
    total_inserted = 0

    for file in files_to_process:
        filepath = os.path.join(data_dir, file)
        if not os.path.exists(filepath):
            continue
            
        print(f"📖 Reading {file}...")
        with open(filepath, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
            
        loc_batch = []
        search_batch = []
        
        for feature in geojson_data.get("features", []):
            geom = feature.get("geometry", {})
            if geom.get("type") != "Point": continue
                
            coords = geom.get("coordinates", [])
            if len(coords) < 2: continue
            lon, lat = coords[0], coords[1]
            
            if not (4.0 <= lat <= 21.0 and 116.0 <= lon <= 127.0): continue

            props = feature.get("properties", {})
            name = props.get("Name") or props.get("SchoolName") or props.get("name")
            category = props.get("Category") or "school"
            
            if name:
                # We will use a temporary ID logic, but SQLite handles rowids automatically
                loc_batch.append((name, category, lat, lon))
                
        # Insert into main table
        cursor.executemany("INSERT INTO locations (name, category, lat, lon) VALUES (?, ?, ?, ?)", loc_batch)
        db.commit()
        
        # Get the IDs we just inserted to link them to the FTS table
        # (Simplified: we just insert the names into FTS and link by name for this prototype)
        for name, category, lat, lon in loc_batch:
            search_batch.append((name, name, category))
            
        cursor.executemany("INSERT INTO poi_search (id, name, category) VALUES (NULL, ?, ?)", search_batch)
        db.commit()
        
        total_inserted += len(loc_batch)
        print(f"✅ Indexed {len(loc_batch)} locations into FTS5 engine.")

    print(f"\n🎉 Done! Total locations indexed: {total_inserted}")
    db.close()

if __name__ == "__main__":
    # Delete old DB to start fresh
    if os.path.exists("para_poi.db"):
        os.remove("para_poi.db")
    ingest_pois()