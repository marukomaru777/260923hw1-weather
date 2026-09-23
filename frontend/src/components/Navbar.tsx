import React from 'react';
import { CloudSun, MapPin, RefreshCw, Star, Bell } from 'lucide-react';
import type { WeatherAlert } from '../types/weather';

interface NavbarProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  counties: string[];
  alerts: WeatherAlert[];
  onRefresh: () => void;
  isLoading: boolean;
  favoritesCount: number;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity,
  onSelectCity,
  counties,
  alerts,
  onRefresh,
  isLoading,
  favoritesCount,
  onlyFavorites,
  onToggleOnlyFavorites
}) => {
  return (
    <header className="glass-panel" style={{ margin: '16px 24px', padding: '12px 24px', position: 'sticky', top: '16px', zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}>
            <CloudSun size={24} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #F8FAFC 0%, #38BDF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Taiwan Weather Platform
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>CWA 中央氣象署即時串接</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              <span style={{ color: '#10B981', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* City Quick Selector & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* City Select Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '6px 14px'
          }}>
            <MapPin size={16} color="var(--accent-blue)" />
            <select
              id="city-select"
              value={currentCity}
              onChange={(e) => onSelectCity(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 600,
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

          {/* Quick Only-Favorites Button in Navbar */}
          <button
            id="nav-only-favorites-toggle"
            className={`btn-glass ${onlyFavorites ? 'active' : ''}`}
            onClick={onToggleOnlyFavorites}
            style={{
              color: onlyFavorites ? '#F59E0B' : 'inherit',
              borderColor: onlyFavorites ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'
            }}
            title="僅查看收藏地點"
          >
            <Star size={15} fill={onlyFavorites ? '#F59E0B' : 'none'} color="#F59E0B" />
            <span>只看收藏 ({favoritesCount})</span>
          </button>

          {/* Refresh Button */}
          <button
            id="refresh-btn"
            className="btn-glass"
            onClick={onRefresh}
            title="刷新即時數據"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          {/* Alert Indicator */}
          {alerts.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              fontSize: '13px',
              fontWeight: 700
            }}>
              <Bell size={14} className="animate-pulse-glow" />
              <span>{alerts.length} 則特報</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
