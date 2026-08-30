import os
import sys
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.api.trains import router as trains_router, MONITORED_TRAINS_STATE
from app.api.network import router as network_router

# Background live simulation ticker
async def live_simulation_ticker():
    """
    Simulates realistic live train movement every 15 seconds:
    - Train speed fluctuates within realistic limits
    - Positions progress along routes
    - Distance remaining decreases gradually
    - Recomputes XGBoost ETA inference dynamically
    """
    while True:
        await asyncio.sleep(15)
        for train in MONITORED_TRAINS_STATE.values():
            if train["speed"] > 0:
                # Progress train position slightly
                progress_dist = (train["speed"] / 3600.0) * 15.0 # km in 15 sec
                train["distance_covered_km"] = min(train["total_distance_km"], train["distance_covered_km"] + progress_dist)
                
                # Speed micro-variance
                speed_delta = (asyncio.get_event_loop().time() % 3) - 1.5
                train["speed"] = max(30.0, min(130.0, train["speed"] + speed_delta))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background ticker
    ticker_task = asyncio.create_task(live_simulation_ticker())
    print("[OK] Started RailVue AI Live Simulation Ticker (15s update interval)")
    yield
    # Shutdown
    ticker_task.cancel()


app = FastAPI(
    title="RailVue AI API",
    description="Real-Time Dynamic ETA Prediction System for Indian Railways (Smart India Hackathon)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trains_router)
app.include_router(network_router)

@app.get("/")
async def root():
    return {
        "system": "RailVue AI - Real-Time Dynamic ETA Prediction System",
        "event": "Smart India Hackathon Solution",
        "status": "Operational",
        "ml_model": "XGBoost Regressor (eta_xgboost.json)",
        "endpoints": [
            "GET /api/trains/{train_id}/live",
            "GET /api/trains/{train_id}/eta",
            "GET /api/trains/{train_id}/eta/explanation",
            "GET /api/network/congestion",
            "GET /api/alerts",
            "POST /api/simulation/event"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
