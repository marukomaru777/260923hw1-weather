import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import type { WeatherAlert } from '../types/weather';

interface WindyAlertsWidgetProps {
  alerts: WeatherAlert[];
  onSelectCity: (city: string) => void;
}

export const WindyAlertsWidget: React.FC<WindyAlertsWidgetProps> = ({
  alerts,
  onSelectCity
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (alerts.length === 0) {
    return (
      <div
        id="windy-alerts-panel"
        className="windy-glass"
        style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          zIndex: 50,
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px'
        }}
      >
        <ShieldCheck size={16} color="#10B981" />
        <span style={{ color: '#D1FAE5', fontWeight: 600 }}>全台無重大特報</span>
      </div>
    );
  }

  return (
    <div
      id="windy-alerts-panel"
      className="windy-glass"
      style={{
        position: 'absolute',
        top: '16px',
        right: '20px',
        zIndex: 50,
        width: '310px',
        padding: '12px 14px',
        borderLeft: '4px solid #EF4444',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={18} color="#EF4444" className="windy-pulse-red" />
          <strong style={{ fontSize: '13px', color: '#FFF' }}>
            中央氣象署特報 ({alerts.length})
          </strong>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Alert Items */}
      {isExpanded && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '220px',
          overflowY: 'auto',
          marginTop: '4px',
          paddingRight: '2px'
        }}>
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#FCA5A5' }}>
                  {alert.title}
                </span>
                <button
                  className="windy-btn"
                  onClick={() => onSelectCity(alert.city)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '11px',
                    borderRadius: '4px'
                  }}
                  title="在地圖上定位此縣市"
                >
                  <MapPin size={10} color="#38BDF8" />
                  <span>{alert.city}</span>
                </button>
              </div>

              <p style={{
                fontSize: '11px',
                color: '#CBD5E1',
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {alert.description || '請注意強陣風及天候變化。'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
