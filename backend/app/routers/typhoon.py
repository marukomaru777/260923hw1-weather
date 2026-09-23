from fastapi import APIRouter, HTTPException

from app.services.cwa_service import cwa_service

router = APIRouter(prefix="/api/typhoon", tags=["Typhoon"])


@router.get("/tracks", summary="目前熱帶氣旋觀測與預測路徑")
async def get_typhoon_tracks():
    try:
        tracks = await cwa_service.get_typhoon_tracks()
        return {"success": True, "count": len(tracks), "data": tracks}
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from None
