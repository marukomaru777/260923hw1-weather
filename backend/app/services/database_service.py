"""Small SQLite persistence layer for fetched environmental data."""
import logging
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

logger = logging.getLogger(__name__)
if os.getenv("VERCEL"):
    # Vercel Functions only provide writable temporary storage; this DB is not durable.
    DEFAULT_DB_PATH = Path(os.getenv("TMPDIR", "/tmp")) / "environment.db"
else:
    DEFAULT_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "environment.db"


class SQLiteStore:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = Path(db_path or os.getenv("DATABASE_PATH", str(DEFAULT_DB_PATH)))

    def _connect(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        with self._connect() as conn:
            conn.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS weather_observations (
                    station_id TEXT NOT NULL,
                    station_name TEXT,
                    county TEXT,
                    town TEXT,
                    latitude REAL,
                    longitude REAL,
                    temperature REAL,
                    humidity REAL,
                    pressure REAL,
                    wind_speed REAL,
                    wind_direction REAL,
                    rainfall REAL,
                    uv_index REAL,
                    weather_desc TEXT,
                    observed_at TEXT NOT NULL,
                    fetched_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                    PRIMARY KEY (station_id, observed_at)
                );
                CREATE INDEX IF NOT EXISTS idx_weather_place_time
                    ON weather_observations(county, town, observed_at DESC);

                CREATE TABLE IF NOT EXISTS forecasts (
                    county TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    weather_desc TEXT,
                    weather_code TEXT,
                    rain_probability INTEGER,
                    min_temp REAL,
                    max_temp REAL,
                    comfort_desc TEXT,
                    fetched_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                    PRIMARY KEY (county, start_time, end_time)
                );

                CREATE TABLE IF NOT EXISTS weather_alerts (
                    city TEXT NOT NULL,
                    title TEXT NOT NULL,
                    severity TEXT,
                    description TEXT,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    fetched_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                    PRIMARY KEY (city, title, start_time, end_time)
                );

            """)

    def _save_many(self, sql: str, rows: Iterable[tuple]) -> int:
        values = list(rows)
        if not values:
            return 0
        try:
            with self._connect() as conn:
                conn.executemany(sql, values)
            return len(values)
        except sqlite3.Error:
            logger.exception("Failed to persist environmental data to %s", self.db_path)
            return 0

    def save_weather_observations(self, stations: List[Dict[str, Any]]) -> int:
        sql = """INSERT INTO weather_observations
            (station_id, station_name, county, town, latitude, longitude, temperature,
             humidity, pressure, wind_speed, wind_direction, rainfall, uv_index,
             weather_desc, observed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(station_id, observed_at) DO UPDATE SET
              temperature=excluded.temperature, humidity=excluded.humidity,
              pressure=excluded.pressure, wind_speed=excluded.wind_speed,
              wind_direction=excluded.wind_direction, rainfall=excluded.rainfall,
              uv_index=excluded.uv_index, weather_desc=excluded.weather_desc"""
        return self._save_many(sql, ((
            s.get("station_id") or "", s.get("station_name"), s.get("county"), s.get("town"),
            s.get("lat"), s.get("lng"), s.get("temperature"), s.get("humidity"),
            s.get("pressure"), s.get("wind_speed"), s.get("wind_direction"), s.get("rain"),
            s.get("uv_index"), s.get("weather_desc"), s.get("obs_time") or "unknown"
        ) for s in stations if s.get("station_id")))

    def save_forecasts(self, forecasts: List[Dict[str, Any]]) -> int:
        sql = """INSERT INTO forecasts
            (county, start_time, end_time, weather_desc, weather_code, rain_probability,
             min_temp, max_temp, comfort_desc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(county, start_time, end_time) DO UPDATE SET
              weather_desc=excluded.weather_desc, weather_code=excluded.weather_code,
              rain_probability=excluded.rain_probability, min_temp=excluded.min_temp,
              max_temp=excluded.max_temp, comfort_desc=excluded.comfort_desc,
              fetched_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"""
        rows = ((
            item.get("city", ""), slot.get("start_time", "unknown"), slot.get("end_time", "unknown"),
            slot.get("weather_desc"), slot.get("weather_code"), slot.get("rain_probability"),
            slot.get("min_temp"), slot.get("max_temp"), slot.get("comfort_desc")
        ) for item in forecasts for slot in item.get("forecasts", []))
        return self._save_many(sql, rows)

    def save_alerts(self, alerts: List[Dict[str, Any]]) -> int:
        sql = """INSERT INTO weather_alerts
            (city, title, severity, description, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(city, title, start_time, end_time) DO UPDATE SET
              severity=excluded.severity, description=excluded.description,
              fetched_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"""
        return self._save_many(sql, ((
            a.get("city", ""), a.get("title", "天氣特報"), a.get("severity"),
            a.get("description"), a.get("start_time") or "unknown", a.get("end_time") or "unknown"
        ) for a in alerts))

    def get_weather_history(self, station_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        query = "SELECT * FROM weather_observations"
        params: tuple = ()
        if station_id:
            query += " WHERE station_id = ?"
            params = (station_id,)
        query += " ORDER BY observed_at DESC LIMIT ?"
        params += (limit,)
        with self._connect() as conn:
            return [dict(row) for row in conn.execute(query, params).fetchall()]

    def status(self) -> Dict[str, Any]:
        with self._connect() as conn:
            tables = ("weather_observations", "forecasts", "weather_alerts")
            counts = {table: conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] for table in tables}
        return {"path": str(self.db_path), "tables": counts}


sqlite_store = SQLiteStore()
