import logging
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx

from app.config import CWA_API_KEY, CWA_BASE_URL, CACHE_TTL_SECONDS
from app.services.cache_service import cache

logger = logging.getLogger(__name__)

# Standard 22 counties in Taiwan
TAIWAN_COUNTIES = [
    "基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣",
    "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市",
    "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"
]

class CWAService:
    def __init__(self, api_key: str = CWA_API_KEY):
        self.api_key = api_key

    async def _fetch(self, dataset_id: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fetch data from CWA with error handling"""
        query_params = {"Authorization": self.api_key}
        if params:
            query_params.update(params)

        url = f"{CWA_BASE_URL}/{dataset_id}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=query_params)
            resp.raise_for_status()
            data = resp.json()
            if not data.get("success"):
                raise ValueError(f"CWA API returned failure: {data}")
            return data.get("records", {})

    async def get_current_stations(self) -> List[Dict[str, Any]]:
        """
        Fetch all automatic station observations (O-A0003-001)
        Cached for 10 minutes.
        """
        cache_key = "cwa:current_stations"
        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            records = await self._fetch("O-A0003-001")
            raw_stations = records.get("Station", [])
            stations = []

            for st in raw_stations:
                geo = st.get("GeoInfo", {})
                coords = geo.get("Coordinates", [])
                wgs84 = next((c for c in coords if c.get("CoordinateName") == "WGS84"), None)
                if not wgs84 and coords:
                    wgs84 = coords[-1]

                lat = float(wgs84.get("StationLatitude", 0)) if wgs84 else 0.0
                lng = float(wgs84.get("StationLongitude", 0)) if wgs84 else 0.0

                we = st.get("WeatherElement", {})
                
                # Helper to safely parse float
                def parse_val(v, default=None):
                    try:
                        val = float(v)
                        return val if val > -90 else default
                    except (ValueError, TypeError):
                        return default

                now_data = we.get("Now", {})
                precip = parse_val(now_data.get("Precipitation"), 0.0) if isinstance(now_data, dict) else 0.0

                station_clean = {
                    "station_id": st.get("StationId"),
                    "station_name": st.get("StationName"),
                    "county": geo.get("CountyName", ""),
                    "town": geo.get("TownName", ""),
                    "lat": lat,
                    "lng": lng,
                    "altitude": parse_val(geo.get("StationAltitude")),
                    "temperature": parse_val(we.get("AirTemperature")),
                    "humidity": parse_val(we.get("RelativeHumidity")),
                    "pressure": parse_val(we.get("AirPressure")),
                    "wind_speed": parse_val(we.get("WindSpeed")),
                    "wind_direction": parse_val(we.get("WindDirection")),
                    "rain": precip,
                    "uv_index": parse_val(we.get("UVIndex")),
                    "weather_desc": we.get("Weather", "正常"),
                    "obs_time": st.get("ObsTime", {}).get("DateTime", "")
                }
                # Filter out stations without valid coordinates
                if lat != 0.0 and lng != 0.0:
                    stations.append(station_clean)

            cache.set(cache_key, stations, ttl=CACHE_TTL_SECONDS)
            return stations
        except Exception as e:
            logger.error(f"Error fetching stations: {e}")
            raise

    async def get_36h_forecast(self, city: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch 36-hour general weather forecast (F-C0032-001)
        """
        norm_city = city.replace("台", "臺") if city else None
        cache_key = f"cwa:forecast_36h:{norm_city or 'ALL'}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        params = {}
        if norm_city:
            params["locationName"] = norm_city

        records = await self._fetch("F-C0032-001", params=params)
        raw_locations = records.get("location", [])
        results = []

        for loc in raw_locations:
            loc_name = loc.get("locationName")
            we_elements = {el["elementName"]: el["time"] for el in loc.get("weatherElement", [])}

            # Elements: Wx, PoP, MinT, MaxT, CI
            time_slots = []
            wx_times = we_elements.get("Wx", [])
            for i, slot in enumerate(wx_times):
                start = slot.get("startTime", "")
                end = slot.get("endTime", "")
                wx_param = slot.get("parameter", {})
                
                pop_val = 0
                if "PoP" in we_elements and len(we_elements["PoP"]) > i:
                    try:
                        pop_val = int(we_elements["PoP"][i].get("parameter", {}).get("parameterName", 0))
                    except (ValueError, TypeError):
                        pop_val = 0

                min_t = None
                if "MinT" in we_elements and len(we_elements["MinT"]) > i:
                    try:
                        min_t = float(we_elements["MinT"][i].get("parameter", {}).get("parameterName", 0))
                    except (ValueError, TypeError):
                        min_t = None

                max_t = None
                if "MaxT" in we_elements and len(we_elements["MaxT"]) > i:
                    try:
                        max_t = float(we_elements["MaxT"][i].get("parameter", {}).get("parameterName", 0))
                    except (ValueError, TypeError):
                        max_t = None

                ci_desc = ""
                if "CI" in we_elements and len(we_elements["CI"]) > i:
                    ci_desc = we_elements["CI"][i].get("parameter", {}).get("parameterName", "")

                time_slots.append({
                    "start_time": start,
                    "end_time": end,
                    "weather_desc": wx_param.get("parameterName", ""),
                    "weather_code": wx_param.get("parameterValue", "1"),
                    "rain_probability": pop_val,
                    "min_temp": min_t,
                    "max_temp": max_t,
                    "comfort_desc": ci_desc
                })

            results.append({
                "city": loc_name,
                "forecasts": time_slots
            })

        cache.set(cache_key, results, ttl=CACHE_TTL_SECONDS)
        return results

    async def get_alerts(self) -> List[Dict[str, Any]]:
        """
        Fetch active weather hazards/warnings (W-C0033-001)
        """
        cache_key = "cwa:alerts"
        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            records = await self._fetch("W-C0033-001")
            raw_locations = records.get("location", [])
            alerts = []

            for loc in raw_locations:
                loc_name = loc.get("locationName", "")
                hazard_cond = loc.get("hazardConditions", {})
                hazards = hazard_cond.get("hazards", [])
                for h in hazards:
                    info = h.get("info", {})
                    valid = h.get("validTime", {})
                    alerts.append({
                        "city": loc_name,
                        "title": info.get("phenomena", "天氣特報"),
                        "severity": info.get("significanceLevel", "一般注意"),
                        "description": info.get("description", ""),
                        "start_time": valid.get("startTime", ""),
                        "end_time": valid.get("endTime", "")
                    })

            cache.set(cache_key, alerts, ttl=300) # 5 min TTL
            return alerts
        except Exception as e:
            logger.warning(f"Error fetching alerts: {e}")
            return []

    async def get_city_current_weather(self, city: str) -> Dict[str, Any]:
        """
        Extract primary representative weather for a specific city
        Combining forecast (high/low/pop/ci) with station real-time observations
        """
        norm_city = city.replace("台", "臺")
        # 1. Fetch 36h forecast for this city
        forecast_list = await self.get_36h_forecast(city=norm_city)
        city_forecast = forecast_list[0] if forecast_list else None
        current_slot = city_forecast["forecasts"][0] if (city_forecast and city_forecast["forecasts"]) else {}

        # 2. Find stations in this city
        stations = await self.get_current_stations()
        city_stations = [s for s in stations if norm_city in s.get("county", "")]
        
        # Pick the most complete station (valid temp & humidity)
        rep_station = None
        for s in city_stations:
            if s.get("temperature") is not None and s.get("humidity") is not None:
                rep_station = s
                break
        if not rep_station and city_stations:
            rep_station = city_stations[0]

        temp = rep_station.get("temperature") if rep_station else None
        if temp is None and current_slot:
            temp = current_slot.get("max_temp")

        humidity = rep_station.get("humidity") if rep_station else 70
        rain = rep_station.get("rain") if rep_station else 0.0
        wind_speed = rep_station.get("wind_speed") if rep_station else 1.5
        wind_dir = rep_station.get("wind_direction") if rep_station else 0
        pressure = rep_station.get("pressure") if rep_station else 1013.0
        uv = rep_station.get("uv_index") if rep_station else 3.0

        # Calculate feel-like temperature (Australian apparent temp approximation)
        feel_like = None
        if temp is not None and humidity is not None and wind_speed is not None:
            e = (humidity / 100.0) * 6.105 * (2.71828 ** ((17.27 * temp) / (237.7 + temp)))
            feel_like = round(temp + 0.33 * e - 0.70 * wind_speed - 4.00, 1)

        return {
            "city": norm_city,
            "station_name": rep_station.get("station_name") if rep_station else f"{norm_city}代表站",
            "station_id": rep_station.get("station_id") if rep_station else "",
            "temperature": temp,
            "feels_like": feel_like if feel_like is not None else temp,
            "min_temp": current_slot.get("min_temp"),
            "max_temp": current_slot.get("max_temp"),
            "weather_desc": current_slot.get("weather_desc") or (rep_station.get("weather_desc") if rep_station else "晴時多雲"),
            "weather_code": current_slot.get("weather_code", "1"),
            "rain_probability": current_slot.get("rain_probability", 0),
            "comfort_desc": current_slot.get("comfort_desc", "舒適"),
            "rain_1h": rain,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "wind_direction": wind_dir,
            "pressure": pressure,
            "uv_index": uv,
            "obs_time": rep_station.get("obs_time") if rep_station else current_slot.get("start_time", ""),
            "forecast_slots": city_forecast["forecasts"] if city_forecast else []
        }

cwa_service = CWAService()
