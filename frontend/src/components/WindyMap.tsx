import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CountyOverview, Station } from '../types/weather';

export type WeatherLayer = 'temp' | 'wind' | 'rain' | 'humidity';

function getLayerValue(layer: WeatherLayer, station?: Station, overviewTemperature?: number | null) {
  if (layer === 'temp') {
    const value = overviewTemperature ?? station?.temperature;
    return value == null ? null : { text: `${Math.round(value)}°`, color: '#67d7ca' };
  }
  if (!station) return null;
  if (layer === 'wind') return station.wind_speed == null ? null : { text: `${station.wind_speed}m/s`, color: '#60a5fa' };
  if (layer === 'rain') return { text: `${station.rain}mm`, color: '#38bdf8' };
  return station.humidity == null ? null : { text: `${station.humidity}%`, color: '#c4a7ff' };
}

interface WindyMapProps {
  stations: Station[];
  overviewList: CountyOverview[];
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
  overviewList,
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
  const adminLayerRef = useRef<L.GeoJSON | null>(null);
  const adminLabelsRef = useRef<L.LayerGroup | null>(null);
  const adminDataRef = useRef<any>(null);
  const drawLabelsRef = useRef<() => void>(() => {});
  const focusFavoriteRef = useRef<() => void>(() => {});
  const onSelectCityRef = useRef(onSelectCity);
  onSelectCityRef.current = onSelectCity;
  const [mapZoom, setMapZoom] = useState(7.8);

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
      map.attributionControl.setPrefix(false);
      map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>');
      map.attributionControl.addAttribution('行政區界線：內政部國土測繪中心（政府資料開放授權）');

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'osm-dark-basemap',
        attribution: ''
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapZoom(map.getZoom());
      map.on('zoomend', () => setMapZoom(map.getZoom()));
      adminLayerRef.current = L.geoJSON(undefined, {
        style: {
          color: '#58636a',
          weight: 0.9,
          opacity: 0.82,
          fillColor: '#2c3035',
          fillOpacity: 0.72
        },
        onEachFeature: (feature, layer) => {
        const county = feature.properties?.COUNTYNAME ?? '';
        const town = feature.properties?.TOWNNAME ?? '';
        layer.on('click', () => {
          onSelectCityRef.current(`${county}|${town}`);
          mapInstanceRef.current?.fitBounds((layer as L.Polyline).getBounds().pad(0.15), { maxZoom: 12, animate: true });
        });
        }
      }).addTo(map);
      adminLabelsRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Draw only administrative geography and labels: no road, satellite, or terrain tiles.
  useEffect(() => {
    let cancelled = false;
    fetch('/taiwan-townships.geojson')
      .then(response => {
        if (!response.ok) throw new Error(`行政區界線載入失敗 (${response.status})`);
        return response.json();
      })
      .then(data => {
        if (cancelled || !mapInstanceRef.current || !adminLayerRef.current) return;
        adminDataRef.current = data;
        adminLayerRef.current.addData(data);
        drawLabelsRef.current();
        focusFavoriteRef.current();
      })
      .catch(error => console.error('無法載入行政區界線：', error));

    const map = mapInstanceRef.current;
    const onZoom = () => drawLabelsRef.current();
    map?.on('zoomend', onZoom);
    return () => {
      cancelled = true;
      map?.off('zoomend', onZoom);
    };
  }, []);

  const drawAdministrativeLabels = () => {
    const map = mapInstanceRef.current;
    const labels = adminLabelsRef.current;
    const data = adminDataRef.current;
    if (!map || !labels || !data) return;
    labels.clearLayers();

    const [focusedCounty, focusedTown] = focusedFavorite.split('|');
    const features = (data.features ?? []).filter((feature: any) => {
      const county = feature.properties?.COUNTYNAME ?? '';
      const town = feature.properties?.TOWNNAME ?? '';
      if (focusedFavorite) return county === focusedCounty && (!focusedTown || town === focusedTown);
      if (onlyFavorites) return favorites.some(favorite => {
        const [favoriteCounty, favoriteTown] = favorite.split('|');
        return county === favoriteCounty && (!favoriteTown || town === favoriteTown);
      });
      return true;
    });

    const visibleBounds = map.getBounds();
    const visibleFeatures = features.filter((feature: any) => L.geoJSON(feature).getBounds().intersects(visibleBounds));

    if (map.getZoom() >= 10) {
      visibleFeatures.forEach((feature: any) => {
        const townLayer = L.geoJSON(feature);
        const county = feature.properties?.COUNTYNAME ?? '';
        const town = feature.properties?.TOWNNAME ?? '';
        const townStation = stations.find(station => station.county === county && station.town === town);
        const value = getLayerValue(activeLayer, townStation, undefined);
        const center: L.LatLngExpression = townStation?.lat != null && townStation.lng != null
          ? [townStation.lat, townStation.lng]
          : townLayer.getBounds().getCenter();
        L.marker(center, {
          interactive: true,
          pane: 'tooltipPane',
          icon: L.divIcon({
            className: `admin-area-label town-label${county === currentCity && town === currentTown ? ' selected' : ''}`,
            html: `<span><b>${town}</b>${value ? `<strong style="color:${value.color}">${value.text}</strong>` : ''}</span>`,
            iconSize: [1, 1],
            iconAnchor: [0, 0]
          })
        }).on('click', () => {
          onSelectCityRef.current(`${county}|${town}`);
          map.fitBounds(townLayer.getBounds().pad(0.15), { maxZoom: 12, animate: true });
        }).addTo(labels);
      });
      return;
    }

    const countyBounds = new Map<string, L.LatLngBounds>();
    visibleFeatures.forEach((feature: any) => {
      const county = feature.properties?.COUNTYNAME ?? '';
      const bounds = L.geoJSON(feature).getBounds();
      const combined = countyBounds.get(county);
      if (combined) combined.extend(bounds);
      else countyBounds.set(county, bounds);
    });
    countyBounds.forEach((bounds, county) => {
      const countyWeather = overviewList.find(item => item.city === county);
      const countyStation = stations.find(station => station.county === county);
      const value = getLayerValue(activeLayer, countyStation, countyWeather?.temperature);
      L.marker(bounds.getCenter(), {
        interactive: true,
        pane: 'tooltipPane',
        icon: L.divIcon({
          className: `admin-area-label county-label${county === currentCity ? ' selected' : ''}`,
          html: `<span><b>${county}</b>${value ? `<strong style="color:${value.color}">${value.text}</strong>` : ''}</span>`,
          iconSize: [1, 1],
          iconAnchor: [0, 0]
        })
      }).on('click', () => {
        onSelectCityRef.current(county);
        map.fitBounds(bounds.pad(0.12), { maxZoom: 10.5, animate: true });
      }).addTo(labels);
    });
  };
  drawLabelsRef.current = drawAdministrativeLabels;

  const focusFavoriteOnMap = () => {
    const map = mapInstanceRef.current;
    const data = adminDataRef.current;
    if (!focusedFavorite || !map || !data) return;
    const [county, town] = focusedFavorite.split('|');
    const bounds = L.latLngBounds([]);
    (data.features ?? []).forEach((feature: any) => {
      if (feature.properties?.COUNTYNAME === county && (!town || feature.properties?.TOWNNAME === town)) {
        bounds.extend(L.geoJSON(feature).getBounds());
      }
    });
    if (bounds.isValid()) map.fitBounds(bounds.pad(town ? 0.8 : 0.12), {
      maxZoom: town ? 12 : 9,
      animate: true
    });
  };
  focusFavoriteRef.current = focusFavoriteOnMap;

  // Focus a saved location only when the selection changes. Keeping this out
  // of the marker redraw effect lets normal wheel/buttons zoom freely.
  useEffect(() => {
    focusFavoriteRef.current();
  }, [focusedFavorite]);

  useEffect(() => {
    drawAdministrativeLabels();
  }, [focusedFavorite, favorites, onlyFavorites, overviewList, stations, currentCity, currentTown, activeLayer]);

  // Update weather station markers based on selected area and active layer
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    const [focusedCounty, focusedTown] = focusedFavorite.split('|');
    const matchesFocus = (county: string, town?: string) => !focusedFavorite || (
      county === focusedCounty && (!focusedTown || (town ? town === focusedTown : true))
    );

    const currentAreaStations = stations.filter(s =>
      s.county === currentCity && (!currentTown || s.town === currentTown)
    );
    let displayStations = focusedFavorite
      ? currentAreaStations.filter(s => matchesFocus(s.county, s.town))
      : onlyFavorites
      ? currentAreaStations.filter(s => favorites.some(fav => fav.includes('|') ? fav === `${s.county}|${s.town}` : s.county === fav))
      : currentAreaStations;

    // Keep the national overview readable: show one representative observation
    // for the selected county, then reveal its stations as the user zooms in.
    if (mapZoom < 10) displayStations = [];
    else if (mapZoom < 12 && displayStations.length > 1) {
      const townStations = new Map<string, Station>();
      displayStations.forEach(station => {
        const key = `${station.county}|${station.town}`;
        if (!townStations.has(key)) townStations.set(key, station);
      });
      displayStations = Array.from(townStations.values());
    }

    displayStations.forEach(s => {
      const isFav = favorites.some(fav => s.county.includes(fav));
      const isCurrentCity = s.county.includes(currentCity) && (!currentTown || s.town === currentTown);

      // Determine badge label and color by active layer
      let label = '';
      let badgeColor = '#4fb5b2';
      let arrowHtml = '';

      if (activeLayer === 'temp') {
        const t = s.temperature;
        label = t !== null ? `${Math.round(t)}°` : '--';
        if (t === null) badgeColor = '#94a3a8';
        else if (t < 18) badgeColor = '#61a9c2';
        else if (t < 24) badgeColor = '#54b9a8';
        else if (t < 28) badgeColor = '#e4bb52';
        else badgeColor = '#e87560';
      } else if (activeLayer === 'wind') {
        const w = s.wind_speed;
        label = w !== null ? `${w}m/s` : '--';
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
            background: ${isCurrentCity ? '#e87560' : 'rgba(20, 27, 37, 0.94)'};
            border: ${isFav ? '2px solid #e4ae37' : `1.5px solid ${badgeColor}`};
            color: #f1f5f9;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 5px;
            border-radius: 8px;
            box-shadow: 0 2px 8px ${isCurrentCity ? 'rgba(232, 117, 96, 0.42)' : 'rgba(38, 76, 87, 0.18)'};
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(5px);
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
        onSelectCityRef.current(`${s.county}|${s.town}`);
        const townBounds = L.latLngBounds([]);
        adminDataRef.current?.features?.forEach((feature: any) => {
          if (feature.properties?.COUNTYNAME === s.county && feature.properties?.TOWNNAME === s.town) {
            townBounds.extend(L.geoJSON(feature).getBounds());
          }
        });
        if (townBounds.isValid()) mapInstanceRef.current?.fitBounds(townBounds.pad(0.15), { maxZoom: 12, animate: true });
      });

      // Windy-style Popup
      const popupHtml = `
        <div style="min-width: 170px; padding: 2px; font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #429e9b; font-size: 14px;">${s.station_name}</strong>
            <span style="font-size: 11px; color: #71818a;">${s.county} ${s.town}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #40545c;">
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
              background: #4caeaa;
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
  }, [stations, activeLayer, favorites, onlyFavorites, currentCity, currentTown, focusedFavorite, mapZoom]);

  // Listen to popup custom event to switch city
  useEffect(() => {
    const handleSelect = (e: any) => {
      if (e.detail) onSelectCityRef.current(e.detail);
    };
    window.addEventListener('windy-select-city', handleSelect);
    return () => window.removeEventListener('windy-select-city', handleSelect);
  }, []);

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
