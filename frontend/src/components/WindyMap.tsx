import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Station } from '../types/weather';
import type { AirQualitySite } from '../types/weather';

export type WeatherLayer = 'temp' | 'wind' | 'rain' | 'humidity' | 'air';

interface WindyMapProps {
  stations: Station[];
  airQuality: AirQualitySite[];
  currentCity: string;
  currentTown: string;
  focusedFavorite: string;
  onSelectCity: (city: string) => void;
  activeLayer: WeatherLayer;
  favorites: string[];
  onlyFavorites: boolean;
}

export const WindyMap: React.FC<WindyMapProps> = ({
  stations,
  airQuality,
  currentCity,
  currentTown,
  focusedFavorite,
  onSelectCity,
  activeLayer,
  favorites,
  onlyFavorites
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.8, 120.9],
        zoom: 7.8,
        zoomControl: true,
        attributionControl: true
      });

      // Taiwan NLSC e-Map via OGC WMTS: clear local roads, place names and boundaries.
      L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://maps.nlsc.gov.tw/">內政部國土測繪中心</a> 台灣通用電子地圖',
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

  // Update Markers based on layer, stations, and onlyFavorites
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    const [focusedCounty, focusedTown] = focusedFavorite.split('|');
    const matchesFocus = (county: string, town?: string) => !focusedFavorite || (
      county === focusedCounty && (!focusedTown || (town ? town === focusedTown : true))
    );

    if (activeLayer === 'air') {
      const visibleAirSites = airQuality.filter(site => site.lat !== null && site.lng !== null && site.aqi !== null)
        .filter(site => matchesFocus(site.county))
        .filter(site => !onlyFavorites || favorites.some(fav => fav.includes('|') ? fav.startsWith(`${site.county}|`) : site.county.includes(fav)))
      if (focusedFavorite && visibleAirSites.length) {
        const bounds = L.latLngBounds(visibleAirSites.map(site => [site.lat as number, site.lng as number] as L.LatLngTuple));
        mapInstanceRef.current.fitBounds(bounds.pad(focusedTown ? 0.8 : 0.12), { maxZoom: focusedTown ? 11 : 9, animate: true });
      }
      visibleAirSites.forEach(site => {
          const value = site.aqi as number;
          const color = value <= 50 ? '#22c55e' : value <= 100 ? '#eab308' : value <= 150 ? '#f97316' : value <= 200 ? '#ef4444' : value <= 300 ? '#a855f7' : '#78350f';
          const marker = L.circleMarker([site.lat as number, site.lng as number], {
            radius: 9, color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.95
          }).bindTooltip(`${site.site_name} · AQI ${value}`, { direction: 'top' });
          marker.on('click', () => onSelectCity(site.county));
          markersLayerRef.current?.addLayer(marker);
        });
      return;
    }

    const displayStations = focusedFavorite
      ? stations.filter(s => matchesFocus(s.county, s.town))
      : onlyFavorites
      ? stations.filter(s => favorites.some(fav => fav.includes('|') ? fav === `${s.county}|${s.town}` : s.county.includes(fav)))
      : stations;

    if (focusedFavorite && displayStations.length) {
      const bounds = L.latLngBounds(displayStations.map(s => [s.lat, s.lng] as L.LatLngTuple));
      mapInstanceRef.current.fitBounds(bounds.pad(focusedTown ? 0.8 : 0.12), {
        maxZoom: focusedTown ? 12 : 9,
        animate: true
      });
    } else if (!focusedFavorite && !onlyFavorites) {
      mapInstanceRef.current.setView([23.8, 120.9], 7.8, { animate: true });
    }

    displayStations.forEach(s => {
      const isFav = favorites.some(fav => s.county.includes(fav));
      const isCurrentCity = s.county.includes(currentCity) && (!currentTown || s.town === currentTown);

      // Determine badge label and color by active layer
      let label = '';
      let badgeColor = '#38BDF8';
      let arrowHtml = '';

      if (activeLayer === 'temp') {
        const t = s.temperature;
        label = t !== null ? `${Math.round(t)}°` : '--';
        if (t === null) badgeColor = '#94A3B8';
        else if (t < 18) badgeColor = '#38BDF8';
        else if (t < 24) badgeColor = '#10B981';
        else if (t < 28) badgeColor = '#F59E0B';
        else badgeColor = '#EF4444';
      } else if (activeLayer === 'wind') {
        const w = s.wind_speed;
        label = w !== null ? `${w}m` : '--';
        badgeColor = '#60A5FA';
        // Wind direction arrow (Pure Windy feature!)
        const dir = s.wind_direction ?? 0;
        arrowHtml = `
          <svg style="transform: rotate(${dir}deg); width: 10px; height: 10px; margin-right: 2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        `;
      } else if (activeLayer === 'rain') {
        const r = s.rain;
        label = `${r}mm`;
        badgeColor = r > 0 ? '#06B6D4' : 'rgba(148, 163, 184, 0.4)';
      } else if (activeLayer === 'humidity') {
        const h = s.humidity;
        label = h !== null ? `${h}%` : '--';
        badgeColor = '#A78BFA';
      }

      // Star badge if favorite
      const starHtml = isFav ? `<span style="color: #F59E0B; margin-left: 2px; font-size: 9px;">★</span>` : '';

      // Create Custom Windy Marker
      const customIcon = L.divIcon({
        className: 'windy-station-marker',
        html: `
          <div style="
            background: ${isCurrentCity ? 'rgba(225, 29, 72, 0.92)' : 'rgba(15, 23, 42, 0.88)'};
            border: ${isFav ? '2px solid #F59E0B' : `1.5px solid ${badgeColor}`};
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 5px;
            border-radius: 8px;
            box-shadow: 0 0 ${isCurrentCity ? '14px rgba(225, 29, 72, 0.8)' : `8px ${badgeColor}66`};
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(8px);
            transform: scale(${isCurrentCity ? 1.2 : 1});
            transition: transform 0.2s ease;
          ">
            ${arrowHtml}
            <span>${label}</span>
            ${starHtml}
          </div>
        `,
        iconSize: [40, 20],
        iconAnchor: [20, 10]
      });

      const marker = L.marker([s.lat, s.lng], { icon: customIcon });

      // Click to select this city in the Windy panel
      marker.on('click', () => {
        onSelectCity(`${s.county}|${s.town}`);
      });

      // Windy-style Popup
      const popupHtml = `
        <div style="min-width: 170px; padding: 2px; font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #38BDF8; font-size: 14px;">${s.station_name}</strong>
            <span style="font-size: 11px; color: #94A3B8;">${s.county} ${s.town}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #E2E8F0;">
            <div>🌡️ 氣溫：<strong>${s.temperature ?? '--'} °C</strong></div>
            <div>💨 風速：<strong>${s.wind_speed ?? '--'} m/s</strong> (方位 ${s.wind_direction ?? 0}°)</div>
            <div>🌧️ 時雨量：<strong>${s.rain} mm</strong></div>
            <div>💧 相對濕度：<strong>${s.humidity ?? '--'}%</strong></div>
          </div>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('windy-select-city', { detail: '${s.county}|${s.town}' }))"
            style="
              margin-top: 8px;
              width: 100%;
              background: #0284C7;
              border: none;
              color: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            "
          >
            檢視 ${s.county} 氣象預報
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerRef.current?.addLayer(marker);
    });
  }, [stations, airQuality, activeLayer, favorites, onlyFavorites, currentCity, currentTown, focusedFavorite, onSelectCity]);

  // Listen to popup custom event to switch city
  useEffect(() => {
    const handleSelect = (e: any) => {
      if (e.detail) onSelectCity(e.detail);
    };
    window.addEventListener('windy-select-city', handleSelect);
    return () => window.removeEventListener('windy-select-city', handleSelect);
  }, [onSelectCity]);

  return (
    <div
      id="windy-map-canvas"
      ref={mapContainerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1
      }}
    />
  );
};
