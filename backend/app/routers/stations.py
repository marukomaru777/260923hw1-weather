from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.cwa_service import cwa_service

router = APIRouter(prefix="/api/stations", tags=["Stations"])

@router.get("")
async def get_stations(
    county: Optional[str] = Query(None, description="依縣市篩選測站"),
    min_temp: Optional[float] = Query(None, description="最低溫度篩選"),
    format: str = Query("json", description="回傳格式: 'json' 或 'geojson'")
):
    try:
        stations = await cwa_service.get_current_stations()
        if county:
            norm_c = county.replace("台", "臺")
            stations = [s for s in stations if norm_c in s.get("county", "")]
        if min_temp is not None:
            stations = [s for s in stations if s.get("temperature") is not None and s["temperature"] >= min_temp]

        if format.lower() == "geojson":
            features = []
            for s in stations:
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [s["lng"], s["lat"]]
                    },
                    "properties": s
                })
            return {
                "type": "FeatureCollection",
                "features": features
            }

        return {"success": True, "count": len(stations), "data": stations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
