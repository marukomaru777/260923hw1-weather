import React from 'react';
import { Droplets, Wind, Gauge, SunMedium, CloudRain, Thermometer } from 'lucide-react';
import type { CurrentWeather } from '../types/weather';

interface MetricsGridProps {
  weather: CurrentWeather;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ weather }) => {
  // Helper for UV level
  const getUVLevel = (uv: number | null) => {
    if (uv === null) return { text: '未知', color: '#94A3B8' };
    if (uv <= 2) return { text: '低量級 (微弱)', color: '#10B981' };
    if (uv <= 5) return { text: '中量級 (注意)', color: '#FBBF24' };
    if (uv <= 7) return { text: '高量級 (防曬)', color: '#F97316' };
    if (uv <= 10) return { text: '過量級 (危險)', color: '#EF4444' };
    return { text: '危險級 (極高)', color: '#8B5CF6' };
  };

  // Helper for wind compass
  const getWindDirection = (deg: number | null) => {
    if (deg === null) return '無風';
    const directions = ['北風', '東北風', '東風', '東南風', '南風', '西南風', '西風', '西北風'];
    const idx = Math.round(deg / 45) % 8;
    return directions[idx];
  };

  const uvInfo = getUVLevel(weather.uv_index);

  const metrics = [
    {
      id: 'metric-rain',
      title: '降雨機率 / 雨量',
      value: `${weather.rain_probability}%`,
      subtitle: `過去 1h 雨量：${weather.rain_1h !== null ? weather.rain_1h : 0} mm`,
      icon: <CloudRain size={20} color="#38BDF8" />,
      accent: '#38BDF8'
    },
    {
      id: 'metric-humidity',
      title: '相對濕度',
      value: `${weather.humidity !== null ? weather.humidity : '--'}%`,
      subtitle: weather.humidity && weather.humidity > 80 ? '濕度偏高，環境潮濕' : '濕度適中舒適',
      icon: <Droplets size={20} color="#06B6D4" />,
      accent: '#06B6D4'
    },
    {
      id: 'metric-wind',
      title: '風速與風向',
      value: `${weather.wind_speed !== null ? weather.wind_speed : '--'} m/s`,
      subtitle: `${getWindDirection(weather.wind_direction)} (${weather.wind_direction ?? 0}°)`,
      icon: <Wind size={20} color="#60A5FA" />,
      accent: '#60A5FA'
    },
    {
      id: 'metric-uv',
      title: '紫外線指數 (UV)',
      value: weather.uv_index !== null ? weather.uv_index.toFixed(1) : '--',
      subtitle: uvInfo.text,
      icon: <SunMedium size={20} color={uvInfo.color} />,
      accent: uvInfo.color
    },
    {
      id: 'metric-pressure',
      title: '大氣壓力',
      value: `${weather.pressure !== null ? Math.round(weather.pressure) : '--'} hPa`,
      subtitle: '標準海平面氣壓約 1013 hPa',
      icon: <Gauge size={20} color="#A78BFA" />,
      accent: '#A78BFA'
    },
    {
      id: 'metric-feels-like',
      title: '體感溫度',
      value: `${weather.feels_like !== null ? Math.round(weather.feels_like) : '--'}°C`,
      subtitle: `舒適度評估：${weather.comfort_desc || '舒適'}`,
      icon: <Thermometer size={20} color="#F472B6" />,
      accent: '#F472B6'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginTop: '16px'
    }}>
      {metrics.map(m => (
        <div key={m.id} id={m.id} className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.title}</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {m.icon}
            </div>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: '#FFF',
            marginBottom: '4px'
          }}>
            {m.value}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {m.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
};
