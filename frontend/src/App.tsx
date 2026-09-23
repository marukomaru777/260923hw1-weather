import React, { useEffect, useState, useCallback } from 'react';
import { WindyMap, type WeatherLayer } from './components/WindyMap';
import { WindyTopBar } from './components/WindyTopBar';
import { WindyAlertsWidget } from './components/WindyAlertsWidget';
import { WindyLayerPicker } from './components/WindyLayerPicker';
import { WindyDetailPanel } from './components/WindyDetailPanel';
import { WindyBottomTimeline } from './components/WindyBottomTimeline';
import {
  fetchCurrentWeather,
  fetchCountiesOverview,
  fetchStations,
  fetchAlerts
} from './services/api';
import { getLocalFavorites, toggleLocalFavorite } from './services/favoritesStorage';
import type { CurrentWeather, CountyOverview, Station, WeatherAlert } from './types/weather';
import { Loader2 } from 'lucide-react';

export const ALL_COUNTIES = [
  '基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣',
  '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '臺南市',
  '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣'
];

export const App: React.FC = () => {
  const [currentCity, setCurrentCity] = useState<string>('臺北市');
  const [activeLayer, setActiveLayer] = useState<WeatherLayer>('temp');
  
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [overviewList, setOverviewList] = useState<CountyOverview[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  
  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => getLocalFavorites());
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCityLoading, setIsCityLoading] = useState<boolean>(false);

  // Load Global Data
  const loadGlobalData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [overviewData, stationData, alertData] = await Promise.all([
        fetchCountiesOverview(),
        fetchStations(),
        fetchAlerts()
      ]);
      setOverviewList(overviewData);
      setStations(stationData);
      setAlerts(alertData);
    } catch (err: any) {
      console.error('Error loading global weather data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load City Data
  const loadCityWeather = useCallback(async (city: string) => {
    setIsCityLoading(true);
    try {
      const data = await fetchCurrentWeather(city);
      setCurrentWeather(data);
    } catch (err: any) {
      console.error(`Error loading weather for ${city}:`, err);
    } finally {
      setIsCityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGlobalData();
  }, [loadGlobalData]);

  useEffect(() => {
    loadCityWeather(currentCity);
  }, [currentCity, loadCityWeather]);

  // Handle Favorites toggle
  const handleToggleFavorite = (city: string) => {
    const updated = toggleLocalFavorite(city);
    setFavorites(updated);
  };

  const handleSelectCity = (city: string) => {
    // Normalize city string e.g. "臺北市" or "新竹市"
    const matched = ALL_COUNTIES.find(c => city.includes(c) || c.includes(city));
    setCurrentCity(matched || city);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* 1. Fullscreen Map Canvas Engine (Windy.com Style) */}
      <WindyMap
        stations={stations}
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        activeLayer={activeLayer}
        favorites={favorites}
        onlyFavorites={onlyFavorites}
      />

      {/* 2. Top-Left Floating Bar: Logo, City Dropdown, Favorite Filter, Quick City Pills */}
      <WindyTopBar
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        counties={ALL_COUNTIES}
        favorites={favorites}
        onlyFavorites={onlyFavorites}
        onToggleOnlyFavorites={() => setOnlyFavorites(!onlyFavorites)}
        onRefresh={() => {
          loadGlobalData();
          loadCityWeather(currentCity);
        }}
        isLoading={isLoading || isCityLoading}
      />

      {/* 3. Top-Right Floating Alerts Widget (預警在右上) */}
      <WindyAlertsWidget
        alerts={alerts}
        onSelectCity={handleSelectCity}
      />

      {/* 4. Right Sidebar: Layer Picker (溫度, 風速, 雨量, 濕度) */}
      <WindyLayerPicker
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
      />

      {/* 5. Left Floating Drawer: Weather Details, Metrics, Mini Chart, Star Favorite */}
      <WindyDetailPanel
        weather={currentWeather}
        isFavorite={favorites.includes(currentCity)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* 6. Bottom Floating Dock: 36h Timeline, Color Scale Legend, City Carousel Strip */}
      <WindyBottomTimeline
        weather={currentWeather}
        overviewList={overviewList}
        favorites={favorites}
        onlyFavorites={onlyFavorites}
        onSelectCity={handleSelectCity}
        onToggleFavorite={handleToggleFavorite}
        activeLayer={activeLayer}
      />

      {/* Global Loader Overlay */}
      {isLoading && !currentWeather && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(6, 11, 20, 0.75)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}>
          <Loader2 size={44} color="#E11D48" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ color: '#F8FAFC', fontSize: '15px', fontWeight: 600 }}>
            正在載入全台氣象測站與即時數值...
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
