import React from 'react';
import { CloudRain, Sun, Cloud, CloudSun, Star } from 'lucide-react';
import type { CurrentWeather, CountyOverview } from '../types/weather';

interface WindyBottomTimelineProps {
  weather: CurrentWeather | null;
  overviewList: CountyOverview[];
  favorites: string[];
  onlyFavorites: boolean;
  onSelectCity: (city: string) => void;
  onToggleFavorite: (city: string) => void;
  activeLayer: string;
  focusedFavorite: string;
}

export const WindyBottomTimeline: React.FC<WindyBottomTimelineProps> = ({
  weather,
  overviewList,
  favorites,
  onlyFavorites,
  onSelectCity,
  onToggleFavorite,
  activeLayer,
  focusedFavorite
}) => {
  const slots = weather?.forecast_slots || [];

  const getWeatherIcon = (desc: string) => {
    if (desc.includes('雨')) return <CloudRain size={16} color="#38BDF8" />;
    if (desc.includes('晴') && desc.includes('雲')) return <CloudSun size={16} color="#FBBF24" />;
    if (desc.includes('晴')) return <Sun size={16} color="#F59E0B" />;
    return <Cloud size={16} color="#94A3B8" />;
  };

  const focusedCounty = focusedFavorite.split('|')[0];
  const displayedCounties = focusedFavorite
    ? overviewList.filter(item => item.city === focusedCounty)
    : onlyFavorites
    ? overviewList.filter(item => favorites.includes(item.city) || favorites.some(fav => fav.startsWith(`${item.city}|`)))
    : overviewList;

  return (
    <div
      id="windy-bottom-dock"
      className="windy-glass"
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '20px',
        right: '20px',
        zIndex: 40,
        padding: '12px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Upper row: 36h Timeline for current city + Temperature Color Scale */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Forecast Timeline Slots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', whiteSpace: 'nowrap' }}>
            {weather?.city} 預報
          </span>

          {slots.map((s, idx) => {
            const d = s.start_time ? new Date(s.start_time) : new Date();
            const periodStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours() >= 12 ? '晚' : '早'}`;

            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: '#94A3B8', fontSize: '11px' }}>{periodStr}</span>
                {getWeatherIcon(s.weather_desc)}
                <strong style={{ color: '#FFF' }}>{s.min_temp}°~{s.max_temp}°</strong>
                <span style={{ color: '#38BDF8', fontSize: '11px' }}>☂ {s.rain_probability}%</span>
              </div>
            );
          })}
        </div>

        {/* Windy Color Scale Legend (溫度色階標尺) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#94A3B8' }}>
          <span>{activeLayer === 'air' ? 'AQI 標尺' : `${activeLayer.toUpperCase()} 標尺`}</span>
          <div style={{
            display: 'flex',
            height: '8px',
            width: '120px',
            borderRadius: '4px',
            overflow: 'hidden',
            background: activeLayer === 'air'
              ? 'linear-gradient(90deg, #22c55e 0%, #eab308 25%, #f97316 50%, #ef4444 70%, #a855f7 85%, #78350f 100%)'
              : 'linear-gradient(90deg, #38BDF8 0%, #10B981 35%, #F59E0B 70%, #EF4444 100%)'
          }} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{activeLayer === 'air' ? '0 ~ 300+' : '&lt;16° ~ &gt;30°C'}</span>
        </div>

      </div>

      {/* Lower row: Quick City Carousel Strip (Filtered by favorites if toggled) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingTop: '6px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
          {focusedFavorite ? '★ 聚焦收藏' : onlyFavorites ? '★ 收藏清單' : '全台縣市'}：
        </span>

        {displayedCounties.length === 0 ? (
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>尚未加入收藏，點擊卡片星號即可加入</span>
        ) : (
          displayedCounties.map(item => {
            const isSelected = item.city === weather?.city;
            const isFav = favorites.includes(item.city);

            return (
              <div
                key={item.city}
                onClick={() => onSelectCity(item.city)}
                style={{
                  background: isSelected ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '1px solid #E11D48' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  color: isSelected ? '#FDA4AF' : '#E2E8F0',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontWeight: isSelected ? 800 : 500 }}>{item.city}</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#FFF' }}>
                  {item.temperature !== null ? `${Math.round(item.temperature)}°` : '--'}
                </strong>
                {getWeatherIcon(item.weather_desc)}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.city);
                  }}
                  style={{ cursor: 'pointer', padding: '1px' }}
                  title={isFav ? '取消收藏' : '加入收藏'}
                >
                  <Star size={11} fill={isFav ? '#F59E0B' : 'none'} color={isFav ? '#F59E0B' : '#64748B'} />
                </span>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
