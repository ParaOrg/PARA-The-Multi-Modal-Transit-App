# Para PH — Backend

Multi-modal transit routing engine for Metro Manila, Philippines. Powers the Para PH commuting app with the **Sakay Algorithm** — a composite scoring system that ranks transit routes based on time, cost, hassle, safety, reliability, and community preference.

---

## 📑 Table of Contents
- [🚀 Quick Start](#-quick-start)
- [🧠 The Sakay Algorithm](#-the-sakay-algorithm)
- [📊 Graph Engine](#-graph-engine)
- [🗄️ Database Schema](#️-database-schema)
- [🔌 API Reference](#-api-reference)
- [📁 File Structure](#-file-structure)
- [🌍 Location Resolution](#-location-resolution)
- [🛠️ Setup](#️-setup)
- [📝 License](#-license)

---

## 🚀 Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env  # Add your Supabase credentials
python main.py
```

API runs on `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

---

## 🧠 The Sakay Algorithm

### Why Not Just Dijkstra?
Dijkstra finds the shortest path by time. But Filipino commuters care about more than just speed — they balance cost, safety, familiarity, number of transfers, and reliability. A "faster" route with 4 transfers might be worse than a slightly slower route with 0 transfers.

### How It Works

```text
User types "from UPD to UST"
        │
        ▼
┌──────────────────────────────┐
│ llm_engine.py                │
│ parse_chat_intent()          │  → { origin: "upd", destination: "ust" }
│ normalize_location()         │  → GPS coordinates via gazetteer/Supabase/Nominatim
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ graph_engine.py              │
│ find_k_routes()              │  → Up to 3 candidate paths through transit graph
│                              │  → K-shortest paths using Yen's algorithm variant
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ biyahe_score.py              │
│ rank_routes()                │  → Scores each path on 6 factors
│                              │  → Returns ranked list with explanations
└──────────────────────────────┘
        │
        ▼
ChatResponse with route_data + alternatives + Biyahe Scores
```

### Biyahe Score Factors

| Factor | Weight (Default) | What It Measures |
|--------|------------------|------------------|
| **Time** | 30% | Total travel minutes |
| **Cost** | 25% | Total fare in pesos |
| **Hassle** | 25% | Number of transfers + walk distance |
| **Safety** | 10% | Route safety rating |
| **Reliability** | 5% | Route frequency/availability |
| **Community** | 5% | User ratings from tracked commutes |

### Preset Profiles
Users can choose weight profiles:

- **Balanced (default):** Equal weight on time/cost/hassle
- **Budget:** 50% cost, 10% time
- **Fastest:** 60% time, 10% cost
- **Safest:** 50% safety, 10% time
- **Comfort:** 50% hassle (fewest transfers), 15% time

---

## 📊 Graph Engine

### Transit Graph Structure
- **Nodes:** Transit stops (coordinates like `JeepneyRoute::14.656_121.069`)
- **Edges:** Directed connections between consecutive stops
- **Weight:** `time_min + (distance_km × 0.5)` — optimizes for speed with slight distance penalty
- **Transfer edges:** Walking connections between nearby stops on different routes (< 500m)

### Directionality Rules

| Vehicle Type | Default | Notes |
|--------------|---------|-------|
| Loop routes | `ONE-WAY` | Circles back to start |
| Train/LRT/MRT | `BIDIRECTIONAL` | Dedicated tracks |
| Jeep/Bus/UV | `BIDIRECTIONAL` | Unless marked `is_oneway=true` |
| Walking | `BIDIRECTIONAL` | Between transfer points |

### Walk Path Enhancement
Walk segments use OSRM (Open Source Routing Machine) to generate actual walking paths along roads and sidewalks — not just straight lines. Falls back to straight-line if OSRM is unavailable.

---

## 🗄️ Database Schema

Key tables managed via Supabase:

| Table | Purpose |
|-------|---------|
| `ph_routes` | Route metadata (name, mode, directionality) |
| `ph_route_shapes` | Route geometry (PostGIS LineString) |
| `ph_places` | Points of interest with PostGIS location |
| `ph_place_aliases` | Alternative names for places |
| `ph_geocode_cache` | Cached geocoding results |
| `ph_route_reference` | CSV-imported reference route names |
| `session_messages` | Chat history |
| `gas_stations` | Gas price tracking |

---

## 🔌 API Reference

### Core Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health + graph stats |
| `POST` | `/chat` | Natural language route finding |
| `POST` | `/route` | Programmatic lat/lng route calculation |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/routes/list` | All routes |
| `GET` | `/admin/routes/geojson?route_id=X` | Single route geometry |
| `GET` | `/admin/routes/verified` | Approved routes only |
| `GET` | `/admin/routes/reference` | CSV reference routes |
| `GET` | `/admin/routes/compare` | Match reference vs verified routes |
| `POST` | `/admin/routes/rename` | Rename a route |
| `POST` | `/admin/routes/verify` | Mark route as verified |
| `DELETE` | `/admin/routes/{id}` | Delete route |
| `POST` | `/admin/routes/save` | Save community-submitted route |
| `GET` | `/admin/pending/list` | Pending approval routes |
| `POST` | `/admin/pending/approve` | Approve pending route |
| `POST` | `/admin/pending/reject` | Reject pending route |

### POI Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/poi/list` | All points of interest |
| `POST` | `/poi/add` | Add new POI |

---

## 📁 File Structure

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app entry, lifespan, CORS, graph initialization |
| `api_routes.py` | Chat endpoint, route calculation, POI endpoints |
| `admin_routes.py` | Admin CRUD for routes, approvals |
| `graph_engine.py` | Transit graph builder, Dijkstra pathfinding, K-shortest paths |
| `llm_engine.py` | NLP intent parsing, location normalization, geocoding |
| `biyahe_score.py` | Sakay Algorithm scoring engine with user profiles |
| `models.py` | Pydantic data models for API |
| `config.py` | Environment variable loading and validation |
| `database.py` | Supabase REST client + connection management |
| `smart_cache.py` | Caching layer for frequently accessed data |
| `telemetry_engine.py` | GPS telemetry processing |
| `tasks.py` | Background task definitions |
| `ingest_pois.py` | POI data ingestion utilities |

---

## 🌍 Location Resolution

`normalize_location()` resolves place names using a 4-tier system:

1. **In-memory gazetteer** — 60+ Metro Manila landmarks (instant)
2. **Supabase `ph_places`** — User-contributed POIs with PostGIS
3. **Supabase `ph_place_aliases`** — Alternative names
4. **Nominatim** — OpenStreetMap geocoding fallback

All successful resolutions are cached to `ph_geocode_cache` for future lookups.

---

## 🛠️ Setup

### Requirements
```bash
pip install -r requirements.txt
```

### Environment Variables (`.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
OLLAMA_HOST=http://localhost:11434  # Optional
ENV=development
```

### Run the Server
```bash
python main.py
```

---

## 📝 License

**AGPL-3.0** — Open source. Built for Metro Manila commuters. 🇵🇭
