from fastapi import APIRouter, Query
from typing import Optional

from app.services.database_service import sqlite_store

router = APIRouter(prefix="/api/history", tags=["Environmental History"])


@router.get("/weather-observations")
async def weather_observation_history(
    station_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    data = sqlite_store.get_weather_history(station_id=station_id, limit=limit)
    return {"success": True, "count": len(data), "data": data}
