from fastapi import APIRouter, HTTPException
from app.services.cwa_service import cwa_service

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("")
async def get_alerts():
    try:
        alerts = await cwa_service.get_alerts()
        return {
            "success": True,
            "count": len(alerts),
            "data": alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
