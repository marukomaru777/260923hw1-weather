export type WeatherLayer = 'temp' | 'wind' | 'rain' | 'humidity';
export type AppTheme = 'dark' | 'light';

interface ColorStop {
  position: number;
  color: string;
}

interface WeatherScale {
  label: string;
  min: number;
  max: number;
  range: string;
  ticks: { value: number; label: string }[];
  stops: ColorStop[];
}

export const WEATHER_LAYER_SCALES: Record<WeatherLayer, WeatherScale> = {
  temp: {
    label: '氣溫', min: 16, max: 30, range: '<16°C ~ >30°C',
    ticks: [
      { value: 16, label: '≤16°' }, { value: 20, label: '20°' },
      { value: 24, label: '24°' }, { value: 28, label: '28°' }, { value: 30, label: '≥30°' }
    ],
    stops: [
      { position: 0, color: '#38BDF8' },
      { position: 0.34, color: '#10B981' },
      { position: 0.68, color: '#F59E0B' },
      { position: 1, color: '#EF4444' }
    ]
  },
  wind: {
    label: '風速', min: 0, max: 20, range: '0 ~ 20 m/s',
    ticks: [0, 5, 10, 15, 20].map(value => ({ value, label: `${value}` })),
    stops: [
      { position: 0, color: '#38BDF8' },
      { position: 0.5, color: '#3B82F6' },
      { position: 1, color: '#A78BFA' }
    ]
  },
  rain: {
    label: '雨量', min: 0, max: 50, range: '0 ~ 50 mm',
    ticks: [0, 1, 5, 20, 50].map(value => ({ value, label: `${value}` })),
    stops: [
      { position: 0, color: '#64748B' },
      { position: 0.45, color: '#38BDF8' },
      { position: 1, color: '#2563EB' }
    ]
  },
  humidity: {
    label: '濕度', min: 0, max: 100, range: '0 ~ 100%',
    ticks: [0, 25, 50, 75, 100].map(value => ({ value, label: `${value}%` })),
    stops: [
      { position: 0, color: '#F59E0B' },
      { position: 0.5, color: '#38BDF8' },
      { position: 1, color: '#A78BFA' }
    ]
  }
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16)) as [number, number, number];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
}

export function getWeatherScaleColor(layer: WeatherLayer, value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '#94A3B8';
  const scale = WEATHER_LAYER_SCALES[layer];
  const amount = Math.max(0, Math.min(1, (value - scale.min) / (scale.max - scale.min)));
  const upperIndex = scale.stops.findIndex(stop => stop.position >= amount);
  if (upperIndex <= 0) return scale.stops[Math.max(upperIndex, 0)].color;

  const lower = scale.stops[upperIndex - 1];
  const upper = scale.stops[upperIndex];
  const ratio = (amount - lower.position) / (upper.position - lower.position);
  const lowerRgb = hexToRgb(lower.color);
  const upperRgb = hexToRgb(upper.color);
  return rgbToHex(lowerRgb.map((channel, index) => channel + (upperRgb[index] - channel) * ratio) as [number, number, number]);
}

export function getWeatherScaleGradient(layer: WeatherLayer): string {
  const scale = WEATHER_LAYER_SCALES[layer];
  const stops = scale.stops.map(stop => `${stop.color} ${Math.round(stop.position * 100)}%`).join(', ');
  return `linear-gradient(90deg, ${stops})`;
}
