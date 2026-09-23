import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Station } from '../types/weather';
import { MapPin, Droplets, Maximize2 } from 'lucide-react';

interface WeatherMapViewProps {
  stations: Station[];
  currentCity: string;
  onSelectStation?: (station: Station) => void;
  height?: string;
}

export const WeatherMapView: React.FC<WeatherMapViewProps> = ({
  stations,
  height = '380px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [onlyRaining, setOnlyRaining] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Filter stations
  const filteredStations = stations.filter(s => {
    if (onlyRaining && s.rain <= 0) return false;
    return true;
  });

  // Color helper according to temperature
  const getTempColor = (temp: number | null) => {
    if (temp === null) return '#94A3B8';
    if (temp < 18) return '#38BDF8';
    if (temp < 24) return '#10B981';
    if (temp < 28) return '#F59E0B';
    return '#EF4444';
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.7, 120.9],
        zoom: 7.2,
        zoomControl: true,
        attributionControl: false
      });

      // CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map size when expanded changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);
    }
  }, [isExpanded]);

  // Update Markers when stations change
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredStations.forEach(s => {
      const color = getTempColor(s.temperature);
      const tempDisplay = s.temperature !== null ? `${Math.round(s.temperature)}°` : '--';

      // Custom HTML Marker icon
      const customIcon = L.divIcon({
        className: 'custom-weather-pin',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.88);
            border: 2px solid ${color};
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 5px;
            border-radius: 10px;
            box-shadow: 0 0 8px ${color}77;
            white-space: nowrap;
            text-align: center;
            backdrop-filter: blur(8px);
          ">
            ${tempDisplay}
          </div>
        `,
        iconSize: [34, 18],
        iconAnchor: [17, 9]
      });

      const marker = L.marker([s.lat, s.lng], { icon: customIcon });

      const popupHtml = `
        <div style="min-width: 170px; padding: 2px;">
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px; color: #38BDF8;">
            ${s.station_name}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">
            ${s.county} ${s.town} (${s.station_id})
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span>🌡️ 氣溫:</span>
              <strong style="color: ${color};">${s.temperature !== null ? `${s.temperature}°C` : '--'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>💧 濕度:</span>
              <strong>${s.humidity !== null ? `${s.humidity}%` : '--'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>🌧️ 降雨:</span>
              <strong style="color: #38BDF8;">${s.rain} mm</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>💨 風速:</span>
              <strong>${s.wind_speed !== null ? `${s.wind_speed} m/s` : '--'}</strong>
            </div>
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #64748B; text-align: right;">
            ${s.obs_time ? s.obs_time.slice(11, 16) : ''} 觀測
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerRef.current?.addLayer(marker);
    });
  }, [filteredStations]);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
            即時測站地圖
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({filteredStations.length} 站)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            id="filter-rain-toggle"
            className={`btn-glass ${onlyRaining ? 'active' : ''}`}
            onClick={() => setOnlyRaining(!onlyRaining)}
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            <Droplets size={12} color="#38BDF8" />
            <span>僅降雨站</span>
          </button>

          <button
            id="expand-map-toggle"
            className={`btn-glass ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ padding: '4px 8px' }}
            title="縮放地圖高度"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div
        id="weather-leaflet-map"
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: isExpanded ? '560px' : height,
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          transition: 'height 0.3s ease'
        }}
      />
    </div>
  );
};
