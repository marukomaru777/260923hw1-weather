import logging
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx

from app.config import CWA_API_KEY, CWA_BASE_URL, CACHE_TTL_SECONDS
from app.services.cache_service import cache
from app.services.database_service import sqlite_store

logger = logging.getLogger(__name__)

# Standard 22 counties in Taiwan
TAIWAN_COUNTIES = [
    "基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣",
    "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市",
    "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"
]

# CWA publishes per-county weekly products and a combined Taiwan-wide product.
WEEKLY_FORECAST_DATASETS = {
    "宜蘭縣": "F-D0047-003", "桃園市": "F-D0047-007", "新竹縣": "F-D0047-011",
    "苗栗縣": "F-D0047-015", "彰化縣": "F-D0047-019", "南投縣": "F-D0047-023",
    "雲林縣": "F-D0047-027", "嘉義縣": "F-D0047-031", "屏東縣": "F-D0047-035",
    "臺東縣": "F-D0047-039", "花蓮縣": "F-D0047-043", "澎湖縣": "F-D0047-047",
    "基隆市": "F-D0047-051", "新竹市": "F-D0047-055", "嘉義市": "F-D0047-059",
    "臺北市": "F-D0047-063", "高雄市": "F-D0047-067", "新北市": "F-D0047-071",
    "臺中市": "F-D0047-075", "臺南市": "F-D0047-079", "連江縣": "F-D0047-083",
    "金門縣": "F-D0047-087",
}

class CWAService:
    def __init__(self, api_key: str = CWA_API_KEY):
        self.api_key = api_key

    async def _fetch(self, dataset_id: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fetch data from CWA with error handling"""
        query_params = {"Authorization": self.api_key}
        if params:
            query_params.update(params)

        url = f"{CWA_BASE_URL}/{dataset_id}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, params=query_params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as exc:
            # httpx includes the full request URL in its exception string. That
            # URL contains the CWA Authorization value, so never log/forward it.
            raise RuntimeError(f"CWA dataset {dataset_id} request failed (HTTP {exc.response.status_code})") from None
        except httpx.RequestError as exc:
            raise RuntimeError(f"CWA dataset {dataset_id} request failed ({type(exc).__name__})") from None
        if not data.get("success"):
            raise RuntimeError(f"CWA dataset {dataset_id} returned an unsuccessful response")
        return data.get("records", {})

    @staticmethod
    def _field(obj: Any, *names: str, default=None):
        """Read CWA fields independent of camel/Pascal/snake casing."""
        if not isinstance(obj, dict):
            return default
        normalized = {"".join(ch.lower() for ch in str(key) if ch.isalnum()): value for key, value in obj.items()}
        for name in names:
            value = normalized.get("".join(ch.lower() for ch in name if ch.isalnum()))
            if value is not None:
                return value
        return default

    @staticmethod
    def _as_list(value: Any) -> List[Any]:
        if value is None:
            return []
        return value if isinstance(value, list) else [value]

    @classmethod
    def _typhoon_point(cls, raw: Any, forecast: bool) -> Optional[Dict[str, Any]]:
        if not isinstance(raw, dict):
            return None
        lat = cls._field(raw, "coordinateLatitude", "latitude", "lat")
        lng = cls._field(raw, "coordinateLongitude", "longitude", "lon", "lng")
        coordinate = cls._field(raw, "coordinate", "position")
        if isinstance(coordinate, dict):
            lat = lat if lat is not None else cls._field(coordinate, "latitude", "lat")
            lng = lng if lng is not None else cls._field(coordinate, "longitude", "lon", "lng")
        if (lat is None or lng is None) and isinstance(coordinate, str):
            parts = [part.strip() for part in coordinate.split(",")]
            if len(parts) == 2:
                lat, lng = parts
        try:
            lat, lng = float(lat), float(lng)
        except (TypeError, ValueError):
            return None
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return None

        def radius_km(*field_names: str):
            radius = cls._field(raw, *field_names)
            if isinstance(radius, dict):
                radius = cls._field(radius, "radius", "value")
            try:
                result = float(radius)
                return result if result > 0 else None
            except (TypeError, ValueError):
                return None

        return {
            "lat": lat,
            "lng": lng,
            "time": cls._field(raw, "dateTime", "fixTime", "initialTime", "initTime", "forecastTime", "validTime", "tau", default=""),
            "forecast_hour": cls._field(raw, "forecastHr", "forecastHour", "tau"),
            "max_wind_speed": cls._field(raw, "maxWindSpeed"),
            "pressure": cls._field(raw, "pressure"),
            "radius_15ms_km": radius_km("circle15ms", "circleOf15ms"),
            "radius_25ms_km": radius_km("circle25ms", "circleOf25ms"),
            "is_forecast": forecast,
        }

    @classmethod
    def _extract_typhoon_points(cls, cyclone: Dict[str, Any], forecast: bool) -> List[Dict[str, Any]]:
        dataset = cls._field(cyclone, "dataset", default={})
        datasets = cls._as_list(dataset)
        kind_names = ("forecastData", "forecast") if forecast else ("analysisData", "analysis")
        points: List[Dict[str, Any]] = []

        def collect(node: Any):
            if isinstance(node, list):
                for child in node:
                    collect(child)
            elif isinstance(node, dict):
                point = cls._typhoon_point(node, forecast)
                if point:
                    points.append(point)
                    return
                for child in node.values():
                    if isinstance(child, (dict, list)):
                        collect(child)

        for block in datasets:
            source = cls._field(block, *kind_names)
            if source is None:
                continue
            collect(source)
        # Accept the occasional direct array layout as well.
        if not points:
            direct = cls._field(cyclone, *kind_names)
            collect(direct)
        unique = {}
        for point in points:
            unique[(point["lat"], point["lng"], str(point.get("time", "")))] = point
        return list(unique.values())

    async def get_typhoon_tracks(self) -> List[Dict[str, Any]]:
        """Fetch active tropical-cyclone observed and forecast positions (W-C0034-005)."""
        cache_key = "cwa:typhoon_tracks"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        try:
            records = await self._fetch("W-C0034-005")
            container = self._field(records, "tropicalCyclones", default={})
            cyclones = self._field(container, "tropicalCyclone", "typhoon", default=[])
            tracks = []
            for cyclone in self._as_list(cyclones):
                observed = self._extract_typhoon_points(cyclone, False)
                forecast = self._extract_typhoon_points(cyclone, True)
                if not observed and not forecast:
                    continue
                tracks.append({
                    "id": str(self._field(cyclone, "cwaTyNo", "cwaTdNo", "typhoonName", default="")),
                    "name": self._field(cyclone, "cwaTyphoonName", "typhoonName", default="熱帶氣旋"),
                    "international_name": self._field(cyclone, "typhoonName", default=""),
                    "number": self._field(cyclone, "cwaTyNo", "cwaTdNo", default=""),
                    "observed": observed,
                    "forecast": forecast,
                })
            cache.set(cache_key, tracks, ttl=1800)
            return tracks
        except Exception as exc:
            logger.warning("Unable to load CWA typhoon tracks: %s", type(exc).__name__)
            raise RuntimeError("CWA tropical cyclone feed unavailable") from None

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

            sqlite_store.save_weather_observations(stations)
            cache.set(cache_key, stations, ttl=CACHE_TTL_SECONDS)
            return stations
        except Exception as e:
            logger.error(f"Error fetching stations: {e}")
            raise

    async def get_7d_forecast(self, city: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch CWA one-week township forecasts (F-D0047 products)."""
        norm_city = city.replace("台", "臺") if city else None
        cache_key = f"cwa:forecast_7d:{norm_city or 'ALL'}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        dataset_id = WEEKLY_FORECAST_DATASETS.get(norm_city, "F-D0047-091")
        records = await self._fetch(dataset_id)
        result_by_city: Dict[str, Dict[str, Any]] = {}

        def walk(node: Any, parent_city: str = ""):
            if isinstance(node, list):
                for child in node:
                    walk(child, parent_city)
                return
            if not isinstance(node, dict):
                return
            group_name = self._field(node, "locationsName", "countyName", default=parent_city)
            locations = self._field(node, "location")
            if locations is not None:
                for location in self._as_list(locations):
                    walk(location, group_name)
                return
            elements = self._field(node, "weatherElement")
            if elements is None:
                for value in node.values():
                    if isinstance(value, (dict, list)):
                        walk(value, group_name)
                return

            location_name = self._field(node, "locationName", default="")
            city_name = norm_city or (group_name if group_name in TAIWAN_COUNTIES else (location_name if location_name in TAIWAN_COUNTIES else ""))
            if norm_city and city_name and city_name != norm_city:
                return
            if not city_name:
                return
            city_result = result_by_city.setdefault(city_name, {"city": city_name, "_days": {}})
            for element in self._as_list(elements):
                element_name = str(self._field(element, "elementName", default=""))
                if element_name in {"Wx", "Weather"} or "天氣現象" in element_name or "天氣" == element_name:
                    kind = "wx"
                elif element_name in {"MaxT", "MaxTemperature"} or "最高溫" in element_name:
                    kind = "max"
                elif element_name in {"MinT", "MinTemperature"} or "最低溫" in element_name:
                    kind = "min"
                elif element_name in {"PoP", "PoP12h", "ProbabilityOfPrecipitation"} or "降雨機率" in element_name:
                    kind = "pop"
                else:
                    continue
                for period in self._as_list(self._field(element, "time")):
                    start = str(self._field(period, "startTime", "dataTime", "start", default=""))
                    if len(start) < 10:
                        continue
                    day = city_result["_days"].setdefault(start[:10], {
                        "start_time": start, "end_time": "", "weather_desc": "", "weather_code": "",
                        "rain_probability": None, "min_temp": None, "max_temp": None, "comfort_desc": ""
                    })
                    day["end_time"] = self._field(period, "endTime", "end", default=day["end_time"])
                    parameter = self._field(period, "parameter", default={})
                    values = self._as_list(self._field(period, "elementValue", default=[]))
                    first_value = values[0] if values else {}
                    value = self._field(first_value, "value", "maxTemperature", "minTemperature", "weather", "probabilityOfPrecipitation")
                    if value is None:
                        value = self._field(parameter, "parameterName")
                    if kind == "wx":
                        if not day["weather_desc"]:
                            day["weather_desc"] = self._field(first_value, "weather", "value", default=self._field(parameter, "parameterName", default=""))
                            day["weather_code"] = self._field(first_value, "weatherCode", default=self._field(parameter, "parameterValue", default=""))
                    elif kind in {"max", "min"}:
                        try:
                            number = float(value)
                        except (TypeError, ValueError):
                            continue
                        field = "max_temp" if kind == "max" else "min_temp"
                        previous = day[field]
                        day[field] = number if previous is None else (max(previous, number) if kind == "max" else min(previous, number))
                    elif kind == "pop":
                        try:
                            chance = int(float(value))
                            day["rain_probability"] = max(chance, day["rain_probability"] or 0)
                        except (TypeError, ValueError):
                            pass

        walk(records)
        results = []
        for city_name, city_result in result_by_city.items():
            forecasts = [city_result["_days"][date] for date in sorted(city_result["_days"])[:7]]
            results.append({"city": city_name, "forecasts": forecasts})

        sqlite_store.save_forecasts(results)
        cache.set(cache_key, results, ttl=CACHE_TTL_SECONDS)
        return results

    async def get_short_term_summary(self, city: Optional[str] = None) -> List[Dict[str, Any]]:
        """Keep near-term rain probability for current-condition summaries."""
        norm_city = city.replace("台", "臺") if city else None
        cache_key = f"cwa:forecast_36h_summary:{norm_city or 'ALL'}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        params = {"locationName": norm_city} if norm_city else None
        records = await self._fetch("F-C0032-001", params=params)
        results = []
        for loc in records.get("location", []):
            elements = {element.get("elementName"): element.get("time", []) for element in loc.get("weatherElement", [])}
            slots = []
            for index, wx in enumerate(elements.get("Wx", [])):
                def parameter(name, default=""):
                    times = elements.get(name, [])
                    if index >= len(times):
                        return default
                    return times[index].get("parameter", {}).get("parameterName", default)

                try:
                    rain_probability = int(parameter("PoP", 0))
                except (ValueError, TypeError):
                    rain_probability = 0
                def number(name):
                    try:
                        return float(parameter(name))
                    except (ValueError, TypeError):
                        return None
                slots.append({
                    "start_time": wx.get("startTime", ""),
                    "weather_desc": wx.get("parameter", {}).get("parameterName", ""),
                    "rain_probability": rain_probability,
                    "min_temp": number("MinT"),
                    "max_temp": number("MaxT"),
                    "comfort_desc": parameter("CI")
                })
            results.append({"city": loc.get("locationName", ""), "forecasts": slots})
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

        alerts = []
        try:
            records = await self._fetch("W-C0033-001")
            raw_locations = records.get("location", [])
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
        except Exception as exc:
            logger.warning("Unable to load CWA weather alerts: %s", type(exc).__name__)

        # W-C0034-001 is the CAP-formatted typhoon warning feed. It is raw
        # data, so tolerate the CWA datastore's nested CAP representation.
        try:
            typhoon_records = await self._fetch("W-C0034-001")
            alerts.extend(self._parse_typhoon_alerts(typhoon_records))
        except Exception as exc:
            logger.warning("Unable to load CWA typhoon alerts: %s", type(exc).__name__)

        sqlite_store.save_alerts(alerts)
        cache.set(cache_key, alerts, ttl=300)
        return alerts

    @classmethod
    def _parse_typhoon_alerts(cls, records: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Normalize CAP alert records into the existing alert widget shape."""
        found: List[Dict[str, Any]] = []
        seen = set()

        groups: Dict[tuple, Dict[str, Any]] = {}

        def visit(node: Any, context: Optional[Dict[str, Any]] = None):
            context = dict(context or {})
            if isinstance(node, list):
                for item in node:
                    visit(item, context)
            elif isinstance(node, dict):
                for target, names in (
                    ("title", ("headline", "alertTitle", "title")),
                    ("description", ("description",)),
                    ("event", ("event",)),
                    ("city", ("areaDesc", "city", "locationName")),
                    ("start", ("effective", "onset", "startTime")),
                    ("end", ("expires", "endTime")),
                    ("severity", ("severity",)),
                    ("name", ("cwaTyphoonName", "typhoonName")),
                    ("msg_type", ("msgType",)),
                    ("status", ("status",)),
                ):
                    value = cls._field(node, *names)
                    if value is not None:
                        context[target] = value
                if context.get("description") or context.get("event") == "颱風":
                    key = (context.get("title") or context.get("event"), context.get("start", ""), context.get("description", ""))
                    group = groups.setdefault(key, {"context": context, "cities": set()})
                    if context.get("city"):
                        group["cities"].add(context["city"])
                for value in node.values():
                    if isinstance(value, (dict, list)):
                        visit(value, context)

        visit(records)
        for group in groups.values():
            context = group["context"]
            if context.get("msg_type", "").lower() == "cancel" or context.get("status", "").lower() == "expired":
                continue
            cities = group["cities"] or {"全台"}
            for city in sorted(cities):
                key = (context.get("title"), city, context.get("start", ""), context.get("description", ""))
                if key in seen:
                    continue
                seen.add(key)
                title = context.get("title") or f"颱風警報 {context.get('name', '')}".strip()
                found.append({
                    "city": city,
                    "title": title or "颱風警報",
                    "severity": context.get("severity", "注意"),
                    "description": context.get("description") or "中央氣象署發布颱風警報，請留意最新資訊。",
                    "start_time": context.get("start", ""),
                    "end_time": context.get("end", ""),
                })
        return found

    async def get_city_current_weather(self, city: str) -> Dict[str, Any]:
        """
        Extract primary representative weather for a specific city
        Combining forecast (high/low/pop/ci) with station real-time observations
        """
        norm_city = city.replace("台", "臺")
        # Use the seven-day product for the displayed forecast and the short-
        # range product only for current conditions and near-term rain chance.
        forecast_list = await self.get_7d_forecast(city=norm_city)
        city_forecast = forecast_list[0] if forecast_list else None
        daily_slots = city_forecast["forecasts"] if city_forecast else []
        current_slot = daily_slots[0] if daily_slots else {}
        short_forecasts = await self.get_short_term_summary(city=norm_city)
        short_city = short_forecasts[0] if short_forecasts else None
        short_slot = short_city["forecasts"][0] if short_city and short_city["forecasts"] else {}

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
            "weather_desc": short_slot.get("weather_desc") or current_slot.get("weather_desc") or (rep_station.get("weather_desc") if rep_station else "晴時多雲"),
            "weather_code": current_slot.get("weather_code", "1"),
            "rain_probability": short_slot.get("rain_probability", 0),
            "comfort_desc": short_slot.get("comfort_desc") or current_slot.get("comfort_desc", "舒適"),
            "rain_1h": rain,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "wind_direction": wind_dir,
            "pressure": pressure,
            "uv_index": uv,
            "obs_time": rep_station.get("obs_time") if rep_station else current_slot.get("start_time", ""),
            "forecast_slots": daily_slots
        }

cwa_service = CWAService()
