import React from 'react';
import { Thermometer, Wind, CloudRain, Droplets } from 'lucide-react';
import type { WeatherLayer } from './WindyMap';

interface WindyLayerPickerProps {
  activeLayer: WeatherLayer;
  onLayerChange: (layer: WeatherLayer) => void;
}

export const WindyLayerPicker: React.FC<WindyLayerPickerProps> = ({
  activeLayer,
  onLayerChange
}) => {
  const layers: { id: WeatherLayer; label: string; icon: React.ReactNode }[] = [
    { id: 'temp', label: '氣溫', icon: <Thermometer size={18} /> },
    { id: 'wind', label: '風速', icon: <Wind size={18} /> },
    { id: 'rain', label: '雨量', icon: <CloudRain size={18} /> },
    { id: 'humidity', label: '濕度', icon: <Droplets size={18} /> }
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
    </div>
  );
};
