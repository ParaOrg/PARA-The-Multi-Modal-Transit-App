"""
main.py — Para PH v3.0
Supabase-powered transit routing engine for Metro Manila.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from database import init_db, close_db
from graph_engine import build_transit_graph
from api_routes import router as api_router
from admin_routes import router as admin_router
from config import ENV, CORS_ORIGINS

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and clean up resources"""
    logger.info("🚀 Starting Para PH v3.0...")

    # Database (Supabase PostGIS)
    await init_db()
    logger.info("✅ Database connected")

    # Build transit graph from Supabase
    logger.info("📊 Building transit graph from Supabase...")
    G = await build_transit_graph()
    app.state.G = G

    logger.info(f"✅ Graph loaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    logger.info("✅ Para PH ready!")

    yield

    # Cleanup
    await close_db()
    logger.info("👋 Shutting down...")


app = FastAPI(
    title="Para PH v3.0",
    description="Transit Routing Engine for Metro Manila",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS.split(",") if CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    return {"status": "online", "service": "Para PH v3.0", "env": ENV}


@app.get("/health")
async def health(req: Request):
    G = req.app.state.G
    return {
        "status": "healthy",
        "env": ENV,
        "graph": {
            "nodes": G.number_of_nodes(),
            "edges": G.number_of_edges(),
            "routes": len(G.graph.get("route_nodes", {})),
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
