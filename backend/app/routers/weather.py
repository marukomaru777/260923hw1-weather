from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from app.services.cwa_service import cwa_service, TAIWAN_COUNTIES

router = APIRouter(prefix="/api/weather", tags=["Weather"])

@router.get("/current")
async def get_current_weather(city: str = Query("臺北市", description="台灣縣市名稱，如：臺北市、臺中市、高雄市")):
    try:
        data = await cwa_service.get_city_current_weather(city)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/overview")
async def get_counties_overview():
    """
    Get current temperature and weather summary for all 22 counties in Taiwan
    """
    try:
        # Fetch the seven-day forecast for each county.
        forecasts = await cwa_service.get_7d_forecast()
        short_forecasts = await cwa_service.get_short_term_summary()
        short_by_county = {forecast.get("city"): forecast for forecast in short_forecasts}
        stations = await cwa_service.get_current_stations()
        
        station_by_county = {}
        for s in stations:
            c = s.get("county", "")
            if c and c not in station_by_county and s.get("temperature") is not None:
                station_by_county[c] = s

        overview_list = []
        for fc in forecasts:
            c_name = fc.get("city", "")
            first_slot = fc.get("forecasts", [{}])[0] if fc.get("forecasts") else {}
            short_slots = short_by_county.get(c_name, {}).get("forecasts", [])
            short_slot = short_slots[0] if short_slots else {}
            st = station_by_county.get(c_name)

            temp = st.get("temperature") if st else first_slot.get("max_temp")
            overview_list.append({
                "city": c_name,
                "temperature": temp,
                "min_temp": first_slot.get("min_temp"),
                "max_temp": first_slot.get("max_temp"),
                "weather_desc": first_slot.get("weather_desc", "多雲"),
                "weather_code": first_slot.get("weather_code", "1"),
                "rain_probability": short_slot.get("rain_probability", 0),
                "comfort_desc": first_slot.get("comfort_desc", "")
            })

        return {"success": True, "count": len(overview_list), "data": overview_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/counties")
async def get_counties_list():
    """Return all 22 standard Taiwan county names"""
    return {"success": True, "data": TAIWAN_COUNTIES}
