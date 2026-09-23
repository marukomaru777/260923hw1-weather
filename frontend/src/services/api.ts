import type { CurrentWeather, CountyOverview, Station, WeatherAlert } from '../types/weather';
import {
  FALLBACK_OVERVIEW,
  FALLBACK_STATIONS,
  FALLBACK_ALERTS,
  FALLBACK_CURRENT_WEATHER
} from './fallbackData';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
const API_BASE = `${API_ORIGIN || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')}/api`;

export async function fetchCurrentWeather(city: string): Promise<CurrentWeather> {
  try {
    const res = await fetch(`${API_BASE}/weather/current?city=${encodeURIComponent(city)}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {
    // Use bundled sample data when the API is unavailable.
  }

  const norm = city.replace('台', '臺');
  const matched = FALLBACK_OVERVIEW.find(c => c.city.includes(norm) || norm.includes(c.city));
  const station = FALLBACK_STATIONS.find(s => s.county.includes(norm));

  return {
    ...FALLBACK_CURRENT_WEATHER,
    city: norm,
    station_name: station ? station.station_name : `${norm}站`,
    temperature: matched ? matched.temperature : FALLBACK_CURRENT_WEATHER.temperature,
    min_temp: matched ? matched.min_temp : FALLBACK_CURRENT_WEATHER.min_temp,
    max_temp: matched ? matched.max_temp : FALLBACK_CURRENT_WEATHER.max_temp,
    weather_desc: matched ? matched.weather_desc : FALLBACK_CURRENT_WEATHER.weather_desc,
    rain_probability: matched ? matched.rain_probability : FALLBACK_CURRENT_WEATHER.rain_probability,
    comfort_desc: matched ? matched.comfort_desc : FALLBACK_CURRENT_WEATHER.comfort_desc
  };
}

export async function fetchCountiesOverview(): Promise<CountyOverview[]> {
  try {
    const res = await fetch(`${API_BASE}/weather/overview`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {
    // Use bundled sample data when the API is unavailable.
  }
  return FALLBACK_OVERVIEW;
}

export async function fetchStations(county?: string): Promise<Station[]> {
  try {
    const url = county
      ? `${API_BASE}/stations?county=${encodeURIComponent(county)}`
      : `${API_BASE}/stations`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {
    // Use bundled sample data when the API is unavailable.
  }
  if (county) {
    const norm = county.replace('台', '臺');
    return FALLBACK_STATIONS.filter(s => s.county.includes(norm));
  }
  return FALLBACK_STATIONS;
}

export async function fetchAlerts(): Promise<WeatherAlert[]> {
  try {
    const res = await fetch(`${API_BASE}/alerts`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {
    // Fallback for GitHub Pages
  }
  return FALLBACK_ALERTS;
}
