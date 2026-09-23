import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import weather, forecast, stations, alerts, favorites, history, typhoon
from app.services.cache_service import cache
from app.services.database_service import sqlite_store

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
# httpx logs complete request URLs at INFO level, including CWA Authorization
# query parameters. Keep its request logs quiet so API credentials never enter
# the application log stream.
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

app = FastAPI(
    title="Taiwan Weather Platform API",
    description="台灣環境資訊平台 API - 整合中央氣象署即時觀測、七天天氣預報、全台測站地圖與天氣特報",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local dev (Vite port 5173 / preview)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(weather.router)
app.include_router(forecast.router)
app.include_router(stations.router)
app.include_router(alerts.router)
app.include_router(favorites.router)
app.include_router(history.router)
app.include_router(typhoon.router)

@app.on_event("startup")
async def initialize_database():
    sqlite_store.initialize()

@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "online",
        "service": "Taiwan Weather Platform API",
        "cache": cache.get_info(),
        "database": sqlite_store.status()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
