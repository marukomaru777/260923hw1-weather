import React, { useState } from 'react';
import { CloudSun, CloudRain, Sun, Cloud, Star, MapPin, CheckCircle2 } from 'lucide-react';
import type { CountyOverview } from '../types/weather';

interface CountyOverviewGridProps {
  overviewList: CountyOverview[];
  currentCity: string;
  onSelectCity: (city: string) => void;
  favorites: string[];
  onToggleFavorite: (city: string) => void;
}

export const CountyOverviewGrid: React.FC<CountyOverviewGridProps> = ({
  overviewList,
  currentCity,
  onSelectCity,
  favorites,
  onToggleFavorite
}) => {
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const getWeatherMiniIcon = (desc: string) => {
    if (desc.includes('雨')) return <CloudRain size={18} color="#38BDF8" />;
    if (desc.includes('晴') && desc.includes('雲')) return <CloudSun size={18} color="#FBBF24" />;
    if (desc.includes('晴')) return <Sun size={18} color="#F59E0B" />;
    return <Cloud size={18} color="#94A3B8" />;
  };

  // Filter list based on toggle
  const displayedList = onlyFavorites
    ? overviewList.filter(item => favorites.includes(item.city))
    : overviewList;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginTop: '20px' }}>
      
      {/* Header and Filter Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
            {onlyFavorites ? '⭐ 我的收藏地點氣候' : '全台 22 縣市即時氣候'}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ({displayedList.length} 個城市)
          </span>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="filter-all-counties-btn"
            className={`btn-glass ${!onlyFavorites ? 'active' : ''}`}
            onClick={() => setOnlyFavorites(false)}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            全部 22 縣市
          </button>
          
          <button
            id="filter-only-favorites-btn"
            className={`btn-glass ${onlyFavorites ? 'active' : ''}`}
            onClick={() => setOnlyFavorites(true)}
            style={{
              fontSize: '13px',
              padding: '6px 14px',
              color: onlyFavorites ? '#F59E0B' : 'inherit',
              borderColor: onlyFavorites ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'
            }}
          >
            <Star size={14} fill={onlyFavorites ? '#F59E0B' : 'none'} color="#F59E0B" />
            <span>只顯示收藏 ({favorites.length})</span>
          </button>
        </div>
      </div>

      {/* Empty State when onlyFavorites is true but none favorited */}
      {displayedList.length === 0 && onlyFavorites ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px dashed var(--border-subtle)'
        }}>
          <Star size={36} color="#F59E0B" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
            尚無收藏地點
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            切換至「全部 22 縣市」，點擊卡片右上角的 ⭐ 圖標即可將該城市加入我的收藏！
          </p>
          <button
            className="btn-glass active"
            onClick={() => setOnlyFavorites(false)}
          >
            查看全部 22 縣市
          </button>
        </div>
      ) : (
        /* Cards Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {displayedList.map((item) => {
            const isSelected = item.city === currentCity;
            const isFav = favorites.includes(item.city);

            return (
              <div
                key={item.city}
                id={`county-card-${item.city}`}
                className="glass-card"
                onClick={() => onSelectCity(item.city)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card)',
                  boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none',
                  position: 'relative'
                }}
              >
                {/* Header: City Name, Weather Icon & Star Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                      {item.city}
                    </span>
                    {isSelected && (
                      <span title="當前焦點城市" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <CheckCircle2 size={13} color="#38BDF8" />
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getWeatherMiniIcon(item.weather_desc)}
                    <button
                      id={`star-btn-${item.city}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.city);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                      title={isFav ? '點擊取消收藏' : '點擊加入收藏'}
                    >
                      <Star
                        size={15}
                        fill={isFav ? '#F59E0B' : 'none'}
                        color={isFav ? '#F59E0B' : '#64748B'}
                      />
                    </button>
                  </div>
                </div>

                {/* Big Temperature */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FFF' }}>
                    {item.temperature !== null ? `${Math.round(item.temperature)}°` : '--'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    降雨 {item.rain_probability}%
                  </span>
                </div>

                {/* Description & Min/Max */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>{item.weather_desc}</span>
                  <span>{item.min_temp ?? '--'}°~{item.max_temp ?? '--'}°</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
