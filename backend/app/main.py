import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models # registers all 14 models
from app.routers import (
    auth, dashboard, monitoring, pipelines, leakage, supply, alerts, valves, analytics, simulation
)
from app.services.websocket_manager import ws_manager
from app.simulator.engine import simulator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed if needed
    try:
        from seed_data import seed_database
        db = SessionLocal()
        seed_database(db)
        db.close()
    except Exception as e:
        logger.warning(f"Seed database check skipped or failed: {e}")

    # Start IoT Simulator
    if settings.SIMULATION_ENABLED and not settings.TESTING:
        simulator.start()
        logger.info("IoT Background Simulation started.")

    yield

    # Shutdown
    simulator.stop()
    logger.info("IoT Simulation stopped. Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-Stack Intelligent Water Leakage Detection & Community Water Supply Monitoring System API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(monitoring.router, prefix=settings.API_V1_STR)
app.include_router(pipelines.router, prefix=settings.API_V1_STR)
app.include_router(leakage.router, prefix=settings.API_V1_STR)
app.include_router(supply.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(valves.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or heartbeat
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        ws_manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "simulation_mode": simulator.is_running,
        "docs_url": "/docs"
    }
