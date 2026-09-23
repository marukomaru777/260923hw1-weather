import React from 'react';
import { Wind, MapPin, RefreshCw, Star } from 'lucide-react';

interface WindyTopBarProps {
  currentCity: string;
  currentTown: string;
  towns: string[];
  focusedFavorite: string;
  onClearFocus: () => void;
  onSelectFavorite: (location: string) => void;
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
  currentTown,
  towns,
  focusedFavorite,
  onClearFocus,
  onSelectFavorite,
  onSelectCity,
  counties,
  favorites,
  onlyFavorites,
  onToggleOnlyFavorites,
  onRefresh,
  isLoading
}) => {
  const quickFavorites = [...new Set([focusedFavorite, ...favorites].filter(Boolean))].slice(0, 4);
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
            Taiwan Environment
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>CWA · MOENV</span>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          </div>
        </div>
      </div>

      <div className="windy-glass" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MapPin size={15} color="#F59E0B" />
        <select
          aria-label="選擇鄉鎮市區"
          value={currentTown}
          onChange={e => onSelectCity(e.target.value ? `${currentCity}|${e.target.value}` : currentCity)}
          style={{ background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: '13px', fontWeight: 700, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', maxWidth: '130px' }}
        >
          <option value="" style={{ background: '#0F172A' }}>全部鄉鎮</option>
          {towns.map(town => <option key={town} value={town} style={{ background: '#0F172A' }}>{town}</option>)}
        </select>
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
      {focusedFavorite && (
        <button className="windy-btn active" onClick={onClearFocus} title="恢復全台地圖">
          <MapPin size={14} />顯示全台
        </button>
      )}
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
        {quickFavorites.map(fav => (
          <button
            key={fav}
            className={`windy-btn ${fav === (currentTown ? `${currentCity}|${currentTown}` : currentCity) ? 'active' : ''}`}
            onClick={() => onSelectFavorite(fav)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              background: fav === (currentTown ? `${currentCity}|${currentTown}` : currentCity) ? 'rgba(225, 29, 72, 0.25)' : 'rgba(15, 23, 42, 0.75)'
            }}
          >
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            <span>{fav.replace('|', ' ')}</span>
          </button>
        ))}
      </div>

    </div>
  );
};
