import React from 'react';
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
import { Line, Bar } from 'react-chartjs-2';
import { Calendar, CloudRain, Thermometer, Droplets } from 'lucide-react';
import type { ForecastSlot } from '../types/weather';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastSectionProps {
  slots: ForecastSlot[];
  city: string;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({ slots, city }) => {
  // Format period title
  const formatPeriodTitle = (start: string, idx: number) => {
    if (!start) return `時段 ${idx + 1}`;
    const date = new Date(start);
    const hours = date.getHours();
    const dayStr = `${date.getMonth() + 1}/${date.getDate()}`;
    if (hours >= 6 && hours < 18) {
      return `${dayStr} 白天 (${hours}:00 ~)`;
    } else {
      return `${dayStr} 晚上至清晨 (${hours}:00 ~)`;
    }
  };

  const labels = slots.map((s, idx) => formatPeriodTitle(s.start_time, idx));
  const maxTemps = slots.map(s => s.max_temp ?? 0);
  const minTemps = slots.map(s => s.min_temp ?? 0);
  const popRates = slots.map(s => s.rain_probability);

  // Line Chart Data (Temperature)
  const tempChartData = {
    labels,
    datasets: [
      {
        label: '最高溫 (°C)',
        data: maxTemps,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#F59E0B',
        pointRadius: 5,
      },
      {
        label: '最低溫 (°C)',
        data: minTemps,
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#38BDF8',
        pointRadius: 5,
      }
    ]
  };

  // Bar Chart Data (Rain Probability)
  const popChartData = {
    labels,
    datasets: [
      {
        label: '降雨機率 (%)',
        data: popRates,
        backgroundColor: 'rgba(56, 189, 248, 0.65)',
        borderColor: '#38BDF8',
        borderWidth: 1,
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94A3B8',
          font: { family: 'inherit', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        ticks: { color: '#94A3B8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#94A3B8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  return (
    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Forecast Slots Cards */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Calendar size={20} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFF' }}>
            {city} 今明 36 小時時段預報
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {slots.map((s, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#38BDF8' }}>
                  {formatPeriodTitle(s.start_time, idx)}
                </span>
                <span style={{
                  fontSize: '12px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)'
                }}>
                  {s.comfort_desc || '舒適'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFF' }}>
                    {s.weather_desc}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    氣溫：{s.min_temp}°C ~ {s.max_temp}°C
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38BDF8', fontSize: '16px', fontWeight: 700 }}>
                    <CloudRain size={16} />
                    <span>{s.rain_probability}%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>降雨機率</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart.js Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Temperature Trend Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Thermometer size={18} color="#F59E0B" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
              氣溫走勢圖（最高 / 最低溫）
            </h3>
          </div>
          <div style={{ height: '260px' }}>
            <Line data={tempChartData} options={chartOptions} />
          </div>
        </div>

        {/* Rain Probability Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Droplets size={18} color="#38BDF8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF' }}>
              降雨機率分析（PoP %）
            </h3>
          </div>
          <div style={{ height: '260px' }}>
            <Bar data={popChartData} options={chartOptions} />
          </div>
        </div>

      </div>

    </div>
  );
};
