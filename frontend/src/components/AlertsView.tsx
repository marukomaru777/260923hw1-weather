import React from 'react';
import { AlertTriangle, ShieldCheck, Clock, MapPin } from 'lucide-react';
import type { WeatherAlert } from '../types/weather';

interface AlertsViewProps {
  alerts: WeatherAlert[];
  onSelectCity: (city: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onSelectCity }) => {
  if (alerts.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', marginTop: '16px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <ShieldCheck size={32} color="#10B981" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>
          目前全台無重大氣象特報
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
          中央氣象署目前未發布豪大雨、陸上強風或低溫特報，各地天候大致平穩，請安心出遊。
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <AlertTriangle size={22} color="#EF4444" />
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
          中央氣象署發布中災害性特報 ({alerts.length} 筆)
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className="glass-card"
            style={{
              padding: '20px',
              borderLeft: '4px solid #EF4444',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#F87171',
                  marginRight: '8px'
                }}>
                  {alert.severity || '注意'}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
                  {alert.title}
                </span>
              </div>

              <button
                className="btn-glass"
                onClick={() => onSelectCity(alert.city)}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                <MapPin size={12} />
                <span>{alert.city}</span>
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: 1.5 }}>
              {alert.description || '請注意強陣風與強降雨，山區防範坍方及落石。'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <Clock size={12} />
              <span>有效期間：{alert.start_time ? alert.start_time.slice(5, 16) : '即時'} ~ {alert.end_time ? alert.end_time.slice(5, 16) : '隨時更新'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
