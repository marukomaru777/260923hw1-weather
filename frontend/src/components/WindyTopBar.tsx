import React from 'react';
import { Wind, MapPin, RefreshCw, Star } from 'lucide-react';

interface WindyTopBarProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  counties: string[];
  favorites: string[];
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const WindyTopBar: React.FC<WindyTopBarProps> = ({
  currentCity,
  onSelectCity,
  counties,
  favorites,
  onlyFavorites,
  onToggleOnlyFavorites,
  onRefresh,
  isLoading
}) => {
  return (
    <div
      id="windy-top-bar"
      style={{
        position: 'absolute',
        top: '16px',
        left: '20px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}
    >
      {/* Brand Badge */}
      <div
        className="windy-glass"
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #E11D48 0%, #F97316 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(225, 29, 72, 0.5)'
        }}>
          <Wind size={18} color="#FFF" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em', color: '#FFF' }}>
            Taiwan Weather
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>CWA LIVE</span>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          </div>
        </div>
      </div>

      {/* City Search / Selector */}
      <div
        className="windy-glass"
        style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <MapPin size={16} color="#38BDF8" />
        <select
          id="windy-city-select"
          value={currentCity}
          onChange={(e) => onSelectCity(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F8FAFC',
            fontSize: '14px',
            fontWeight: 700,
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          {counties.map(c => (
            <option key={c} value={c} style={{ background: '#0F172A', color: '#F8FAFC' }}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Favorite Toggle Button */}
      <button
        id="windy-only-favorites-btn"
        className={`windy-btn ${onlyFavorites ? 'gold-active' : ''}`}
        onClick={onToggleOnlyFavorites}
        style={{ padding: '8px 14px' }}
      >
        <Star size={15} fill={onlyFavorites ? '#F59E0B' : 'none'} color="#F59E0B" />
        <span>只看收藏 ({favorites.length})</span>
      </button>

      {/* Refresh Button */}
      <button
        id="windy-refresh-btn"
        className="windy-btn"
        onClick={onRefresh}
        title="重新整理氣象觀測"
        style={{ padding: '8px 10px' }}
      >
        <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
      </button>

      {/* Quick Favorite City Pills (Click to jump immediately!) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {favorites.slice(0, 4).map(fav => (
          <button
            key={fav}
            className={`windy-btn ${fav === currentCity ? 'active' : ''}`}
            onClick={() => onSelectCity(fav)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              background: fav === currentCity ? 'rgba(225, 29, 72, 0.25)' : 'rgba(15, 23, 42, 0.75)'
            }}
          >
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            <span>{fav}</span>
          </button>
        ))}
      </div>

    </div>
  );
};
