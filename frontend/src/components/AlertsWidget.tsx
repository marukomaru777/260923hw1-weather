import React from 'react';
import { AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import type { WeatherAlert } from '../types/weather';

interface AlertsWidgetProps {
  alerts: WeatherAlert[];
  onSelectCity: (city: string) => void;
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({ alerts, onSelectCity }) => {
  return (
    <div
      id="alerts-widget-panel"
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        border: alerts.length > 0 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-subtle)',
        background: alerts.length > 0 
          ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, rgba(18, 24, 38, 0.85) 100%)' 
          : 'var(--bg-surface)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {alerts.length > 0 ? (
            <AlertTriangle size={20} color="#EF4444" className="animate-pulse-glow" />
          ) : (
            <ShieldCheck size={20} color="#10B981" />
          )}
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
            氣象預警特報
          </h3>
        </div>

        {alerts.length > 0 ? (
          <span style={{
            background: 'rgba(239, 68, 68, 0.25)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#F87171',
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
            {alerts.length} 則生效中
          </span>
        ) : (
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '9999px'
          }}>
            天候良好
          </span>
        )}
      </div>

      {/* Content */}
      {alerts.length === 0 ? (
        <div style={{
          padding: '16px',
          background: 'rgba(16, 185, 129, 0.06)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldCheck size={24} color="#10B981" />
          <div style={{ fontSize: '13px', color: '#D1FAE5' }}>
            <strong>目前無災害性天氣特報</strong>
            <p style={{ fontSize: '11px', color: '#A7F3D0', marginTop: '2px' }}>全台各地無豪大雨或強風警戒，天候大致平穩。</p>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '260px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '12px 14px',
                borderLeft: '3px solid #EF4444',
                background: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#FFF' }}>
                  {alert.title}
                </span>
                <button
                  className="btn-glass"
                  onClick={() => onSelectCity(alert.city)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: '6px'
                  }}
                  title="點擊切換至此縣市"
                >
                  <MapPin size={11} color="var(--accent-blue)" />
                  <span>{alert.city}</span>
                </button>
              </div>

              <p style={{
                fontSize: '12px',
                color: '#CBD5E1',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {alert.description || '請注意強陣風及天候變化，戶外活動慎防危險。'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
