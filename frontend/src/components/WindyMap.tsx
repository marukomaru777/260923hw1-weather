import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CountyOverview, Station } from '../types/weather';
import { getWeatherScaleColor, type AppTheme, type WeatherLayer } from '../types/map';

export type { WeatherLayer } from '../types/map';

// Kaohsiung City includes the remote Dongsha and Nansha islands. Their large
// administrative extent pulls a geometry-bounds center far out into the sea,
// so anchor the overview label at the urban center on Taiwan proper.
const COUNTY_LABEL_ANCHORS: Record<string, L.LatLngExpression> = {
  '新竹市': [24.805, 120.91],
  '新竹縣': [24.68, 121.03],
  '嘉義市': [23.49, 120.38],
  '嘉義縣': [23.42, 120.68],
  '高雄市': [22.6273, 120.3014],
  '金門縣': [24.4400, 118.3180],
  '宜蘭縣': [24.7570, 121.7530]
};

const COUNTY_MAINLAND_RADII: Record<string, number> = {
  '高雄市': 150_000,
  '金門縣': 40_000,
  '宜蘭縣': 70_000
};

function getAdministrativeStyle(theme: AppTheme): L.PathOptions {
  return theme === 'light'
    ? { color: '#64748b', weight: 0.9, opacity: 0.75, fillColor: '#e2e8f0', fillOpacity: 0.3 }
    : { color: '#58636a', weight: 0.9, opacity: 0.82, fillColor: '#2c3035', fillOpacity: 0.72 };
}

function isNearCountyLabelAnchor(feature: any, county: string) {
  const anchor = COUNTY_LABEL_ANCHORS[county];
  const mainlandRadius = COUNTY_MAINLAND_RADII[county];
  if (!anchor || mainlandRadius == null) return true;
  const center = L.geoJSON(feature).getBounds().getCenter();
  return center.distanceTo(L.latLng(anchor)) <= mainlandRadius;
}

function getAreaBounds(data: any, county: string, town = '') {
  const bounds = L.latLngBounds([]);
  (data?.features ?? []).forEach((feature: any) => {
    if (
      feature.properties?.COUNTYNAME === county &&
      (!town || feature.properties?.TOWNNAME === town) &&
      (town || isNearCountyLabelAnchor(feature, county))
    ) {
      bounds.extend(L.geoJSON(feature).getBounds());
    }
  });
  return bounds;
}

function getLayerValue(layer: WeatherLayer, station?: Station, overviewTemperature?: number | null) {
  if (layer === 'temp') {
    const value = overviewTemperature ?? station?.temperature;
    return value == null ? null : { text: `${Math.round(value)}°`, color: getWeatherScaleColor(layer, value) };
  }
  if (!station) return null;
  if (layer === 'wind') return station.wind_speed == null ? null : { text: `${station.wind_speed}m/s`, color: getWeatherScaleColor(layer, station.wind_speed) };
  if (layer === 'rain') return { text: `${station.rain}mm`, color: getWeatherScaleColor(layer, station.rain) };
  return station.humidity == null ? null : { text: `${station.humidity}%`, color: getWeatherScaleColor(layer, station.humidity) };
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
  theme: AppTheme;
  userPosition: { latitude: number; longitude: number } | null;
  returnToTaiwanKey: number;
  selectedAreaFocusKey: number;
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
  onlyFavorites,
  theme,
  userPosition,
  returnToTaiwanKey,
  selectedAreaFocusKey
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const adminLayerRef = useRef<L.GeoJSON | null>(null);
  const adminLabelsRef = useRef<L.LayerGroup | null>(null);
  const adminDataRef = useRef<any>(null);
  const drawLabelsRef = useRef<() => void>(() => {});
  const focusFavoriteRef = useRef<() => void>(() => {});
  const focusSelectedAreaRef = useRef<() => void>(() => {});
  const onSelectCityRef = useRef(onSelectCity);
  onSelectCityRef.current = onSelectCity;
  const themeRef = useRef(theme);
  themeRef.current = theme;
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
        className: theme === 'dark' ? 'osm-basemap osm-dark-basemap' : 'osm-basemap',
        attribution: ''
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapZoom(map.getZoom());
      map.on('zoomend', () => setMapZoom(map.getZoom()));
      adminLayerRef.current = L.geoJSON(undefined, {
        style: getAdministrativeStyle(theme),
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

  useEffect(() => {
    mapInstanceRef.current?.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        const tileContainer = layer.getContainer();
        tileContainer?.classList.toggle('osm-dark-basemap', theme === 'dark');
      }
    });
    adminLayerRef.current?.setStyle(getAdministrativeStyle(theme));
  }, [theme]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userPosition) return;
    userLocationMarkerRef.current?.remove();
    const position: L.LatLngExpression = [userPosition.latitude, userPosition.longitude];
    userLocationMarkerRef.current = L.circleMarker(position, {
      radius: 9, color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1
    }).addTo(map).bindTooltip('目前位置');
    map.setView(position, 11, { animate: true });
  }, [userPosition]);

  useEffect(() => {
    if (returnToTaiwanKey > 0) {
      mapInstanceRef.current?.setView([23.8, 120.9], 7.8, { animate: true });
    }
  }, [returnToTaiwanKey]);

  const focusSelectedAreaOnMap = () => {
    const map = mapInstanceRef.current;
    const data = adminDataRef.current;
    if (!map || !data || selectedAreaFocusKey === 0) return;
    const bounds = getAreaBounds(data, currentCity, currentTown);
    if (!bounds.isValid()) return;
    if (currentTown) map.fitBounds(bounds.pad(0.8), { maxZoom: 12, animate: true });
    else map.setView(bounds.getCenter(), 10.5, { animate: true });
  };
  focusSelectedAreaRef.current = focusSelectedAreaOnMap;

  useEffect(() => {
    focusSelectedAreaRef.current();
  }, [selectedAreaFocusKey, currentCity, currentTown]);

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
        adminLayerRef.current.setStyle(getAdministrativeStyle(themeRef.current));
        drawLabelsRef.current();
        focusFavoriteRef.current();
        focusSelectedAreaRef.current();
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

    const features = (data.features ?? []).filter((feature: any) => {
      const county = feature.properties?.COUNTYNAME ?? '';
      const town = feature.properties?.TOWNNAME ?? '';
      if (onlyFavorites) return favorites.some(favorite => {
        const [favoriteCounty, favoriteTown] = favorite.split('|');
        return county === favoriteCounty && (!favoriteTown || town === favoriteTown);
      });
      return true;
    });

    const visibleBounds = map.getBounds();
    const visibleFeatures = features.filter((feature: any) => L.geoJSON(feature).getBounds().intersects(visibleBounds));

    // OSM already provides town and district names. At close zoom keep only
    // the weather station values so we do not duplicate or cover base labels.
    if (map.getZoom() >= 10) return;

    const countyBounds = new Map<string, L.LatLngBounds>();
    visibleFeatures.forEach((feature: any) => {
      const county = feature.properties?.COUNTYNAME ?? '';
      // Kaohsiung's administrative area also contains distant offshore
      // islands. Keep those polygons out of the mainland overview extent.
      if (!isNearCountyLabelAnchor(feature, county)) return;
      const bounds = L.geoJSON(feature).getBounds();
      const combined = countyBounds.get(county);
      if (combined) combined.extend(bounds);
      else countyBounds.set(county, bounds);
    });
    countyBounds.forEach((bounds, county) => {
      const countyWeather = overviewList.find(item => item.city === county);
      const countyStation = stations.find(station => station.county === county);
      const value = getLayerValue(activeLayer, countyStation, countyWeather?.temperature);
      const labelPosition = COUNTY_LABEL_ANCHORS[county] ?? bounds.getCenter();
      L.marker(labelPosition, {
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
        const countyBounds = getAreaBounds(data, county);
        if (countyBounds.isValid()) map.setView(countyBounds.getCenter(), 10.5, { animate: true });
      }).addTo(labels);
    });
  };
  drawLabelsRef.current = drawAdministrativeLabels;

  const focusFavoriteOnMap = () => {
    const map = mapInstanceRef.current;
    const data = adminDataRef.current;
    if (!focusedFavorite || !map || !data) return;
    const [county, town] = focusedFavorite.split('|');
    const bounds = getAreaBounds(data, county, town);
    if (!bounds.isValid()) return;
    if (town) map.fitBounds(bounds.pad(0.8), { maxZoom: 12, animate: true });
    else map.setView(bounds.getCenter(), 10.5, { animate: true });
  };
  focusFavoriteRef.current = focusFavoriteOnMap;

  // Focus a saved location only when the selection changes. Keeping this out
  // of the marker redraw effect lets normal wheel/buttons zoom freely.
  useEffect(() => {
    focusFavoriteRef.current();
  }, [focusedFavorite]);

  useEffect(() => {
    drawAdministrativeLabels();
  }, [focusedFavorite, favorites, onlyFavorites, overviewList, stations, currentCity, currentTown, activeLayer, theme]);

  // Update weather station markers based on selected area and active layer
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    // Focusing one saved location changes only the map camera. Keep all weather
    // readings in the current display mode visible; the favorites mode filters
    // to the complete saved set, never to just the currently focused favorite.
    const availableStations = stations;
    let displayStations = onlyFavorites
      ? availableStations.filter(s => favorites.some(fav => fav.includes('|') ? fav === `${s.county}|${s.town}` : s.county === fav))
      : availableStations;

    // Preserve station data across county selection. At close zoom show all
    // visible county readings, while keeping the nationwide view uncluttered.
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
      // County favorites focus the county but do not mark every township
      // station as a favorite. Only an explicitly saved township gets a star.
      const isFav = favorites.includes(`${s.county}|${s.town}`);
      const isCurrentCity = s.county.includes(currentCity) && (!currentTown || s.town === currentTown);

      // Determine badge label and color by active layer
      let label = '';
      let value: number | null = null;
      let arrowHtml = '';

      if (activeLayer === 'temp') {
        value = s.temperature;
        label = value !== null ? `${Math.round(value)}°` : '--';
      } else if (activeLayer === 'wind') {
        value = s.wind_speed;
        label = value !== null ? `${value}m/s` : '--';
        // Wind direction arrow (Pure Windy feature!)
        const dir = s.wind_direction ?? 0;
        arrowHtml = `
          <svg style="transform: rotate(${dir}deg); width: 10px; height: 10px; margin-right: 2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        `;
      } else if (activeLayer === 'rain') {
        value = s.rain;
        label = `${value}mm`;
      } else if (activeLayer === 'humidity') {
        value = s.humidity;
        label = value !== null ? `${value}%` : '--';
      }
      const badgeColor = getWeatherScaleColor(activeLayer, value);

      // Star badge if favorite
      const starHtml = isFav ? `<span style="color: #F59E0B; margin-left: 2px; font-size: 9px;">★</span>` : '';

      // Create Custom Windy Marker
      const customIcon = L.divIcon({
        className: `windy-station-marker${theme === 'light' ? ' theme-light' : ''}`,
        html: `
          <div style="
            background: ${theme === 'light' ? 'rgba(255, 255, 255, 0.97)' : 'rgba(12, 18, 30, 0.97)'};
            border: ${isFav ? '2px solid #e4ae37' : `1.5px solid ${badgeColor}`};
            color: ${theme === 'light' ? '#0f172a' : '#f8fafc'};
            font-size: 11px;
            font-weight: 700;
            padding: 2px 5px;
            border-radius: 8px;
            box-shadow: 0 2px 8px ${isCurrentCity ? 'rgba(0, 0, 0, 0.42)' : 'rgba(0, 0, 0, 0.24)'};
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: default;
            backdrop-filter: blur(5px);
            transform: scale(${isCurrentCity ? 1.2 : 1});
            transition: transform 0.2s ease;
          ">
            ${arrowHtml}
            <span style="color: ${badgeColor}">${label}</span>
            ${starHtml}
          </div>
        `,
        iconSize: [40, 20],
        iconAnchor: [20, 10]
      });

      // The numeric weather badge is an informational marker, not a link.
      const marker = L.marker([s.lat, s.lng], { icon: customIcon, interactive: false });
      markersLayerRef.current?.addLayer(marker);
    });
  }, [stations, activeLayer, favorites, onlyFavorites, currentCity, currentTown, focusedFavorite, mapZoom, theme]);

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
