import React from 'react';
import { Wind, MapPin, RefreshCw, Star, LocateFixed, Sun, Moon } from 'lucide-react';
import type { CurrentWeather } from '../types/weather';
import type { AppTheme } from '../types/map';

interface WindyTopBarProps {
  currentCity: string;
  currentTown: string;
  weather: CurrentWeather | null;
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
  theme: AppTheme;
  onToggleTheme: () => void;
  onLocate: () => void;
  onReturnToTaiwan: () => void;
  isLocating: boolean;
  locationMessage: string;
}

export const WindyTopBar: React.FC<WindyTopBarProps> = ({
  currentCity,
  currentTown,
  weather,
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
  isLoading,
  theme,
  onToggleTheme,
  onLocate,
  onReturnToTaiwan,
  isLocating,
  locationMessage
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
        <div className="current-weather-chip" aria-label="目前地區天氣">
          <strong>{weather?.temperature == null ? '--' : `${Math.round(weather.temperature)}°`}</strong>
          <span>{weather?.weather_desc ?? '載入中'}</span>
          <small>體感 {weather?.feels_like == null ? '--' : `${Math.round(weather.feels_like)}°`}</small>
        </div>
      </div>

      {/* All-Taiwan and favorites are the two mutually exclusive display modes. */}
      {onlyFavorites ? (
        <button className="windy-btn active" onClick={onClearFocus} title="恢復全台地圖">
          <MapPin size={14} />顯示全台
        </button>
      ) : (
        <button
          id="windy-only-favorites-btn"
          className="windy-btn"
          onClick={onToggleOnlyFavorites}
          style={{ padding: '8px 14px' }}
        >
          <Star size={15} color="#F59E0B" />
          <span>只看收藏</span>
        </button>
      )}

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

      <button
        id="windy-locate-btn"
        className="windy-btn"
        onClick={onLocate}
        disabled={isLocating}
        title="取得目前位置並顯示所在縣市"
        aria-label="定位目前位置"
        style={{ padding: '8px 10px' }}
      >
        <LocateFixed size={14} />
        <span>{isLocating ? '定位中' : '我的位置'}</span>
      </button>
      <button
        id="windy-return-taiwan-btn"
        className="windy-btn"
        onClick={onReturnToTaiwan}
        title="回到台灣全覽"
        aria-label="回到台灣全覽"
        style={{ padding: '8px 10px' }}
      >
        <MapPin size={14} />
        <span>回到台灣</span>
      </button>
      <button
        id="windy-theme-btn"
        className="windy-btn"
        onClick={onToggleTheme}
        title={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
        aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
        style={{ padding: '8px 10px' }}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        <span>{theme === 'dark' ? '淺色' : '深色'}</span>
      </button>
      {locationMessage && <span className="location-status" role="status" aria-live="polite">{locationMessage}</span>}

      <div id="windy-favorites-select-wrap" className="windy-glass">
        <Star size={15} fill="#F59E0B" color="#F59E0B" />
        <select
          id="windy-favorites-select"
          aria-label="選擇收藏地區並聚焦地圖"
          value={focusedFavorite}
          onChange={event => event.target.value ? onSelectFavorite(event.target.value) : onClearFocus()}
        >
          <option value="">我的收藏 ({favorites.length})</option>
          {favorites.map(location => (
            <option key={location} value={location}>{location.replace('|', ' ')}</option>
          ))}
        </select>
      </div>

    </div>
  );
};
