from fastapi import APIRouter, HTTPException
import httpx

from app.config import MOENV_API_KEY
from app.services.cache_service import cache

router = APIRouter(prefix="/api/air-quality", tags=["Air Quality"])
MOENV_URL = "https://data.moenv.gov.tw/api/v2/aqx_p_432"


@router.get("")
async def get_air_quality():
    """Return current MOENV AQI monitoring sites, or an explicit unavailable response."""
    if not MOENV_API_KEY:
        return {"success": False, "data": [], "message": "MOENV_API_KEY 尚未設定"}

    cached = cache.get("moenv_air_quality")
    if cached is not None:
        return {"success": True, "count": len(cached), "data": cached, "source": "MOENV"}

    try:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.get(MOENV_URL, params={
                "api_key": MOENV_API_KEY,
                "format": "JSON",
                "limit": 1000,
            })
            response.raise_for_status()
            payload = response.json()

        records = []
        for item in payload.get("records", []):
            def number(value):
                try:
                    return float(value) if value not in (None, "", "") else None
                except (ValueError, TypeError):
                    return None

            records.append({
                "site_name": item.get("sitename", ""),
                "county": item.get("county", ""),
                "aqi": number(item.get("aqi")),
                "status": item.get("status", ""),
                "pm25": number(item.get("pm2.5")),
                "pm10": number(item.get("pm10")),
                "o3": number(item.get("o3")),
                "co": number(item.get("co")),
                "so2": number(item.get("so2")),
                "no2": number(item.get("no2")),
                "observed_at": item.get("publishtime"),
                "lat": number(item.get("latitude")),
                "lng": number(item.get("longitude")),
            })

        cache.set("moenv_air_quality", records, ttl=600)
        return {"success": True, "count": len(records), "data": records, "source": "MOENV"}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"MOENV 空氣品質資料暫時無法取得: {exc}")
