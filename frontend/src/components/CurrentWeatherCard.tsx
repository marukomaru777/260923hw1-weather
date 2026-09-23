import React from 'react';
import { Sun, CloudRain, Cloud, CloudSun, CloudLightning, Star, Compass, Clock } from 'lucide-react';
import type { CurrentWeather } from '../types/weather';

interface CurrentWeatherCardProps {
  weather: CurrentWeather;
  isFavorite: boolean;
  onToggleFavorite: (city: string) => void;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  weather,
  isFavorite,
  onToggleFavorite
}) => {
  // Helper to render weather icon
  const getWeatherIcon = (desc: string) => {
    if (desc.includes('雨')) return <CloudRain size={72} color="#38BDF8" />;
    if (desc.includes('雷')) return <CloudLightning size={72} color="#F59E0B" />;
    if (desc.includes('晴') && desc.includes('雲')) return <CloudSun size={72} color="#FBBF24" />;
    if (desc.includes('晴')) return <Sun size={72} color="#F59E0B" />;
    return <Cloud size={72} color="#94A3B8" />;
  };

  // Helper for human-friendly advice
  const getAdvice = (w: CurrentWeather) => {
    const tips: string[] = [];
    if (w.rain_probability >= 30 || w.weather_desc.includes('雨')) {
      tips.push('🌧️ 降雨機率較高，出門請攜帶雨具');
    } else {
      tips.push('🌤️ 天氣穩定，適合外出活動');
    }
    if (w.temperature !== null) {
      if (w.temperature >= 28) tips.push('☀️ 氣溫偏熱，請注意補充水分防中暑');
      else if (w.temperature <= 18) tips.push('🧥 氣溫偏涼，建議穿著保暖外套');
      else tips.push('🌿 氣溫適中舒適');
    }
    return tips.join('；');
  };

  return (
    <div className="glass-panel" style={{
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, rgba(18, 24, 38, 0.75) 100%)'
    }}>
      {/* Background soft ambient radial glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top row: City, Station info & Bookmark button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 id="current-city-name" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFF' }}>
              {weather.city}
            </h1>
            <button
              id="favorite-toggle-btn"
              onClick={() => onToggleFavorite(weather.city)}
              style={{
                background: isFavorite ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                border: isFavorite ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                color: isFavorite ? '#F59E0B' : '#94A3B8',
                borderRadius: '10px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              <Star size={16} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : 'currentColor'} />
              <span>{isFavorite ? '已收藏' : '收藏'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Compass size={14} color="var(--accent-blue)" />
              {weather.station_name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} color="var(--accent-blue)" />
              觀測時間：{weather.obs_time ? new Date(weather.obs_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '即時'}
            </span>
          </div>
        </div>

        {/* Weather Tag / Comfort index */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '6px 14px',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--accent-blue)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{weather.comfort_desc || '舒適'}</span>
        </div>
      </div>

      {/* Main Temperature and Icon row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '28px', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontSize: '88px',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(180deg, #FFFFFF 30%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-mono)'
          }}>
            {weather.temperature !== null ? Math.round(weather.temperature) : '--'}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 300, color: 'var(--accent-blue)' }}>°C</span>

          <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>
              {weather.weather_desc}
            </span>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
              <span>體感 {weather.feels_like !== null ? `${Math.round(weather.feels_like)}°` : '--'}</span>
              <span>•</span>
              <span>最高 {weather.max_temp !== null ? `${Math.round(weather.max_temp)}°` : '--'}</span>
              <span>最低 {weather.min_temp !== null ? `${Math.round(weather.min_temp)}°` : '--'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          {getWeatherIcon(weather.weather_desc)}
        </div>
      </div>

      {/* Summary Advice Banner */}
      <div style={{
        marginTop: '28px',
        padding: '12px 18px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        fontSize: '13px',
        color: '#E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>生活提醒：</span>
        <span>{getAdvice(weather)}</span>
      </div>
    </div>
  );
};
