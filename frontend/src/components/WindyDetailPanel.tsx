import React, { useState } from 'react';
import {
  Sun,
  CloudRain,
  Cloud,
  CloudSun,
  CloudLightning,
  Star,
  Compass,
  Clock,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Wind,
  Gauge,
  SunMedium,
  Thermometer
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { CurrentWeather } from '../types/weather';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface WindyDetailPanelProps {
  weather: CurrentWeather | null;
  isFavorite: boolean;
  onToggleFavorite: (city: string) => void;
  favoriteId: string;
}

export const WindyDetailPanel: React.FC<WindyDetailPanelProps> = ({
  weather,
  isFavorite,
  onToggleFavorite,
  favoriteId
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  if (!weather) return null;

  const getWeatherIcon = (desc: string) => {
    if (desc.includes('雨')) return <CloudRain size={36} color="#38BDF8" />;
    if (desc.includes('雷')) return <CloudLightning size={36} color="#F59E0B" />;
    if (desc.includes('晴') && desc.includes('雲')) return <CloudSun size={36} color="#FBBF24" />;
    if (desc.includes('晴')) return <Sun size={36} color="#F59E0B" />;
    return <Cloud size={36} color="#94A3B8" />;
  };

  // Mini Chart Data
  const slots = weather.forecast_slots || [];
  const labels = slots.map((s, idx) => {
    if (!s.start_time) return `${idx + 1}`;
    const d = new Date(s.start_time);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours() >= 12 ? '晚' : '日'}`;
  });
  const maxTemps = slots.map(s => s.max_temp ?? 0);
  const minTemps = slots.map(s => s.min_temp ?? 0);

  const miniChartData = {
    labels,
    datasets: [
      {
        label: '高溫',
        data: maxTemps,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        tension: 0.3,
        pointRadius: 3,
        borderWidth: 2,
        fill: true
      },
      {
        label: '低溫',
        data: minTemps,
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        tension: 0.3,
        pointRadius: 3,
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        padding: 6
      }
    },
    scales: {
      x: { ticks: { color: '#94A3B8', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#94A3B8', font: { size: 10 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
    }
  };

  return (
    <div
      id="windy-detail-panel"
      className="windy-glass"
      style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        zIndex: 40,
        width: collapsed ? '52px' : '360px',
        maxHeight: 'calc(100vh - 190px)',
        overflowY: collapsed ? 'hidden' : 'auto',
        padding: collapsed ? '12px 6px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}
    >
      {/* Toggle Collapse Button */}
      <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFF' }}>
              {weather.city}
            </h2>
            <button
              id="windy-favorite-star-btn"
              onClick={() => onToggleFavorite(favoriteId)}
              style={{
                background: isFavorite ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: isFavorite ? '1px solid #F59E0B' : '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: isFavorite ? '#F59E0B' : '#94A3B8',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <Star size={13} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : 'currentColor'} />
              <span>{isFavorite ? '已收藏' : '收藏'}</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '6px',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={collapsed ? '展開詳細氣象' : '收合面板'}
        >
          {collapsed ? <ChevronRight size={18} color="#FFF" /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Expanded Content */}
      {!collapsed && (
        <>
          {/* Station Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Compass size={12} color="#38BDF8" />
              {weather.station_name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} color="#38BDF8" />
              {weather.obs_time ? weather.obs_time.slice(11, 16) : ''} 即時
            </span>
          </div>

          {/* Big Temperature Hero Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '14px 16px', borderRadius: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FFF', lineHeight: 1 }}>
                  {weather.temperature !== null ? Math.round(weather.temperature) : '--'}
                </span>
                <span style={{ fontSize: '24px', fontWeight: 300, color: '#38BDF8' }}>°C</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', marginTop: '4px' }}>
                {weather.weather_desc}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                體感 {weather.feels_like !== null ? `${Math.round(weather.feels_like)}°` : '--'} • 高 {weather.max_temp ?? '--'}° / 低 {weather.min_temp ?? '--'}°
              </div>
            </div>

            <div>
              {getWeatherIcon(weather.weather_desc)}
            </div>
          </div>

          {/* 6 Micro-Metrics Mini Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
                <CloudRain size={13} color="#38BDF8" />
                <span>降雨機率</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginTop: '2px' }}>
                {weather.rain_probability}%
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
                <Droplets size={13} color="#06B6D4" />
                <span>相對濕度</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginTop: '2px' }}>
                {weather.humidity ?? '--'}%
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
                <Wind size={13} color="#60A5FA" />
                <span>風速風向</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFF', marginTop: '2px' }}>
                {weather.wind_speed ?? '--'} m/s ({weather.wind_direction ?? 0}°)
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
                <SunMedium size={13} color="#F59E0B" />
                <span>紫外線 (UV)</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginTop: '2px' }}>
                {weather.uv_index !== null ? weather.uv_index.toFixed(1) : '--'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
                <Gauge size={13} color="#A78BFA" />
                <span>氣壓</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFF', marginTop: '2px' }}>
                {weather.pressure ? Math.round(weather.pressure) : '--'} hPa
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
                <Thermometer size={13} color="#F472B6" />
                <span>舒適度</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFF', marginTop: '2px' }}>
                {weather.comfort_desc || '舒適'}
              </div>
            </div>
          </div>

          {/* Mini Meteogram Chart */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginBottom: '8px' }}>
              氣溫走勢圖 (36h Meteogram)
            </div>
            <div style={{ height: '110px' }}>
              <Line data={miniChartData} options={miniChartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
