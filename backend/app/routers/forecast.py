from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.cwa_service import cwa_service

router = APIRouter(prefix="/api/forecast", tags=["Forecast"])

@router.get("/7d")
async def get_7d_forecast(city: Optional[str] = Query(None, description="指定縣市名稱")):
    try:
        data = await cwa_service.get_7d_forecast(city=city)
        return {"success": True, "count": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
