import React from 'react';
import { CloudRain, Sun, Cloud, CloudSun, Star } from 'lucide-react';
import type { CurrentWeather, CountyOverview } from '../types/weather';
import { getWeatherScaleGradient, WEATHER_LAYER_SCALES, type WeatherLayer } from '../types/map';

interface WindyBottomTimelineProps {
  weather: CurrentWeather | null;
  overviewList: CountyOverview[];
  favorites: string[];
  onSelectCity: (city: string) => void;
  onToggleFavorite: (city: string) => void;
  activeLayer: WeatherLayer;
}

export const WindyBottomTimeline: React.FC<WindyBottomTimelineProps> = ({
  weather,
  overviewList,
  favorites,
  onSelectCity,
  onToggleFavorite,
  activeLayer
}) => {
  const slots = weather?.forecast_slots || [];

  const getWeatherIcon = (desc: string) => {
    if (desc.includes('雨')) return <CloudRain size={16} color="#38BDF8" />;
    if (desc.includes('晴') && desc.includes('雲')) return <CloudSun size={16} color="#FBBF24" />;
    if (desc.includes('晴')) return <Sun size={16} color="#F59E0B" />;
    return <Cloud size={16} color="#94A3B8" />;
  };

  const displayedCounties = overviewList.filter(item => item.city === weather?.city);
  const legend = WEATHER_LAYER_SCALES[activeLayer];

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
      {/* Upper row: seven-day forecast + active weather color scale */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Forecast Timeline Slots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', whiteSpace: 'nowrap' }}>
            {weather?.city} 預報
          </span>

          {slots.map((s, idx) => {
            const d = s.start_time ? new Date(s.start_time) : new Date();
            const periodStr = `${d.getMonth() + 1}/${d.getDate()} ${['日', '一', '二', '三', '四', '五', '六'][d.getDay()]}`;

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
                {s.rain_probability != null && <span style={{ color: '#38BDF8', fontSize: '11px' }}>☂ {s.rain_probability}%</span>}
              </div>
            );
          })}
        </div>

        {/* Windy Color Scale Legend (溫度色階標尺) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(180px, 260px)', alignItems: 'center', columnGap: '10px', rowGap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
          <span style={{ gridRow: '1 / span 2', fontWeight: 800, whiteSpace: 'nowrap' }}>{`${legend.label}標尺`}</span>
          <div style={{ position: 'relative', height: '12px', borderRadius: '4px', background: getWeatherScaleGradient(activeLayer), border: '1px solid rgba(100, 116, 139, 0.65)', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.2)' }}>
            {legend.ticks.map(tick => {
              const position = (tick.value - legend.min) / (legend.max - legend.min) * 100;
              return <span key={tick.label} aria-hidden="true" style={{ position: 'absolute', left: `${position}%`, top: '-2px', height: '14px', borderLeft: '1px solid rgba(15, 23, 42, 0.75)', transform: 'translateX(-50%)' }} />;
            })}
          </div>
          <div style={{ gridColumn: '2', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, lineHeight: 1 }}>
            {legend.ticks.map(tick => <span key={tick.label}>{tick.label}</span>)}
          </div>
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
          目前縣市：
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
