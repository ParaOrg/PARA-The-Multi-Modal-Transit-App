# 🚙 Para PH (v3.0)

**Para PH** is a hyper-scale geo-sentiment analyzer and multi-modal transit routing engine built specifically for Metro Manila and the Philippines. It combines natural language processing (for local slang normalization) with a highly optimized, crowdsourced spatial routing graph to provide accurate, multi-modal commute directions.

## ✨ Key Features

* **Multi-Modal Routing:** Seamlessly computes paths across Jeepneys, Buses, LRT/MRT, UV Express, and walking routes.
* **Smart Slang Normalization:** Built-in Gazetteer understands colloquial Philippine locations (e.g., "Katips" → "Katipunan", "UPD" → "UP Diliman").
* **Active Commute Tracking:** Step-by-step live guidance, hop-on/hop-off state tracking, and automatic commute logging.
* **Crowdsourced Route Mapping:** Built-in 4-step wizard for capturing Jeepney signs, recording live GPS tracks, and exporting GeoJSON data.
* **Hyper-Fast Caching:** Multi-tiered resolution chain (Gazetteer L1 -> SQLite POI DB L2 -> Redis L3) achieving **0ms latency** for known POIs and completely bypassing 3rd-party API rate limits.

---

## 🏗️ System Architecture

Para PH operates on a decoupled, strictly separated 3-pillar architecture to ensure massive scalability and reliability.

### Pillar 1: AI / NLP Layer (`llm_engine.py`)
Acts purely as a Semantic Interpreter and Named Entity Recognizer (NER). 
* Parses user intents and extracts locations.
* Normalizes local slang via a pre-loaded Gazetteer (78+ terms).
* **Constraint:** Never attempts to output spatial coordinates directly to prevent hallucination.

### Pillar 2: Spatial Resolution & Tiered Caching
Converts normalized location strings into exact `(Lat, Lng)` coordinates using a deterministic fallback chain:
1. **Gazetteer L1:** In-memory exact match (0ms).
2. **POI DB L2 (`para_poi.db`):** Pre-populated and auto-cached SQLite lookup (0ms).
3. **Redis L2 Cache:** Fast distributed cache.
4. **Nominatim API L3:** External geocoding fallback (rate-limited to 1 req/sec).

### Pillar 3: Graph Routing Engine (`graph_engine.py`)
A custom NetworkX `MultiDiGraph` engine enforcing real-world transit rules.
* **Scale:** 10,300+ nodes, 12,500+ edges, 50+ unique transit routes.
* **Directionality Rules:** Jeepneys are strictly one-way loops (with reverse penalties), Buses/Trains are bidirectional.
* **Spatial Transfers:** Builds walking transfer edges between disconnected transit lines via spatial indexing (KDTree/R-Tree) within a 500m radius.
* **Virtual Node Injection:** Snaps origin/destination queries to the graph safely with graduated walking penalties.

---

## 🛠️ Tech Stack

* **Backend:** Python (FastAPI), NetworkX, SQLite, Redis Cluster
* **Frontend:** React, Vite, Tailwind CSS, Leaflet (Maps)
* **Data Layers:** GeoJSON, OpenStreetMap (OSM)

---

## 📂 Project Structure

```text
para.v2/
├── main.py                  # FastAPI application entry point
├── api_routes.py            # Chat and upload endpoints
├── admin_routes.py          # Dashboard and management endpoints
├── graph_engine.py          # MultiDiGraph builder and pathfinder
├── llm_engine.py            # Intent parser + Gazetteer + POI resolver
├── models.py                # Pydantic models
├── geojson_data/            # Source *.geojson route files
├── commute_logs/            # Saved GPS tracks and session logs
├── para_poi.db              # SQLite POI cache 
├── para_ml_data.db          # Feedback and analytics store
└── frontend/                # Symlink to React frontend -> ~/para-frontend
