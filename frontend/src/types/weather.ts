export interface ForecastSlot {
  start_time: string;
  end_time: string;
  weather_desc: string;
  weather_code: string;
  rain_probability: number;
  min_temp: number | null;
  max_temp: number | null;
  comfort_desc: string;
}

export interface CurrentWeather {
  city: string;
  station_name: string;
  station_id: string;
  temperature: number | null;
  feels_like: number | null;
  min_temp: number | null;
  max_temp: number | null;
  weather_desc: string;
  weather_code: string;
  rain_probability: number;
  comfort_desc: string;
  rain_1h: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  uv_index: number;
  obs_time: string;
  forecast_slots: ForecastSlot[];
}

export interface CountyOverview {
  city: string;
  temperature: number | null;
  min_temp: number | null;
  max_temp: number | null;
  weather_desc: string;
  weather_code: string;
  rain_probability: number;
  comfort_desc: string;
}

export interface Station {
  station_id: string;
  station_name: string;
  county: string;
  town: string;
  lat: number;
  lng: number;
  altitude: number | null;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  rain: number;
  uv_index: number | null;
  weather_desc: string;
  obs_time: string;
}

export interface WeatherAlert {
  city: string;
  title: string;
  severity: string;
  description: string;
  start_time: string;
  end_time: string;
}
