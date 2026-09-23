import React from 'react';
import { Thermometer, Wind, CloudRain, Droplets, Sun, Navigation } from 'lucide-react';
import type { WeatherLayer } from '../types/map';

interface WindyLayerPickerProps {
  activeLayer: WeatherLayer;
  onLayerChange: (layer: WeatherLayer) => void;
  showTyphoonTracks: boolean;
  onToggleTyphoonTracks: () => void;
  typhoonCount: number;
  typhoonFeedStatus: 'loading' | 'active' | 'none' | 'unavailable';
}

export const WindyLayerPicker: React.FC<WindyLayerPickerProps> = ({
  activeLayer,
  onLayerChange,
  showTyphoonTracks,
  onToggleTyphoonTracks,
  typhoonCount,
  typhoonFeedStatus
}) => {
  const layers: { id: WeatherLayer; label: string; icon: React.ReactNode }[] = [
    { id: 'temp', label: '氣溫', icon: <Thermometer size={18} /> },
    { id: 'wind', label: '風速', icon: <Wind size={18} /> },
    { id: 'rain', label: '雨量', icon: <CloudRain size={18} /> },
    { id: 'humidity', label: '濕度', icon: <Droplets size={18} /> },
    { id: 'uv', label: '紫外線', icon: <Sun size={18} /> }
  ];

  return (
    <div
      id="windy-layer-picker"
      style={{
        position: 'absolute',
        top: '110px',
        right: '18px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {layers.map(l => (
        <button
          key={l.id}
          id={`layer-btn-${l.id}`}
          className={`layer-btn ${activeLayer === l.id ? 'active' : ''}`}
          onClick={() => onLayerChange(l.id)}
          title={`切換地圖圖層：${l.label}`}
        >
          {l.icon}
          <span style={{ fontSize: '9px', fontWeight: 700 }}>{l.label}</span>
        </button>
      ))}
      <button
        id="layer-btn-typhoon"
        className={`layer-btn ${showTyphoonTracks ? 'active' : ''}`}
        onClick={onToggleTyphoonTracks}
        title={typhoonCount ? `切換颱風路徑（${typhoonCount} 個系統）` : typhoonFeedStatus === 'unavailable' ? '颱風資料暫時無法連線' : '目前沒有活動中的颱風路徑'}
        aria-pressed={showTyphoonTracks}
      >
        <Navigation size={18} />
        <span style={{ fontSize: '9px', fontWeight: 700 }}>颱風{typhoonCount ? ` ${typhoonCount}` : ''}</span>
      </button>
      {showTyphoonTracks && typhoonCount > 0 && (
        <div className="windy-glass" style={{ padding: '7px 9px', fontSize: '9px', lineHeight: 1.7, whiteSpace: 'nowrap' }}>
          <div><span style={{ color: '#2563EB' }}>━━</span> 觀測路徑</div>
          <div><span style={{ color: '#F97316' }}>╌╌</span> 預測路徑</div>
          <div><span style={{ color: '#38BDF8' }}>◯</span> 7級風暴風圈</div>
          <div><span style={{ color: '#A78BFA' }}>◯</span> 10級風暴風圈</div>
        </div>
      )}
      {showTyphoonTracks && typhoonCount === 0 && (
        <div className="windy-glass" role="status" style={{ padding: '7px 9px', fontSize: '9px', lineHeight: 1.5, maxWidth: '132px', textAlign: 'center' }}>
          {typhoonFeedStatus === 'loading' ? '正在取得颱風資料…' : typhoonFeedStatus === 'unavailable' ? '颱風資料暫時無法連線' : '目前沒有活動中的熱帶氣旋'}
        </div>
      )}
    </div>
  );
};
