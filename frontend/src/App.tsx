import React, { useEffect, useState, useCallback } from 'react';
import { WindyMap } from './components/WindyMap';
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
import type { AppTheme, WeatherLayer } from './types/map';
import { findTaiwanAdministrativeArea } from './services/reverseGeocode';
import { Loader2 } from 'lucide-react';

export const ALL_COUNTIES = [
  '基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣',
  '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '臺南市',
  '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣'
];

export const App: React.FC = () => {
  const [currentCity, setCurrentCity] = useState<string>('臺北市');
  const [selectedAreaFocusKey, setSelectedAreaFocusKey] = useState(0);
  const [theme, setTheme] = useState<AppTheme>(() =>
    localStorage.getItem('taiwan-weather-theme') === 'light' ? 'light' : 'dark'
  );
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [returnToTaiwanKey, setReturnToTaiwanKey] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [currentTown, setCurrentTown] = useState<string>('');
  const [focusedFavorite, setFocusedFavorite] = useState<string>('');
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

  useEffect(() => {
    localStorage.setItem('taiwan-weather-theme', theme);
  }, [theme]);

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
    const [countyOrTown, town] = city.split('|');
    const normalized = countyOrTown.replace('台', '臺');
    if (town) {
      setCurrentCity(normalized);
      setCurrentTown(town);
      return;
    }
    const matched = ALL_COUNTIES.find(c => normalized.includes(c) || c.includes(normalized));
    setCurrentCity(matched || normalized);
    setCurrentTown('');
  };
  const handleSelectCityFromDropdown = (city: string) => {
    setFocusedFavorite('');
    handleSelectCity(city);
    setSelectedAreaFocusKey(key => key + 1);
  };
  const handleSelectFavorite = (location: string) => {
    setFocusedFavorite(location);
  };
  const handleSelectSavedLocation = (location: string) => {
    if (favorites.includes(location)) handleSelectFavorite(location);
    else handleSelectCity(location);
  };
  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationMessage('此瀏覽器不支援位置服務');
      return;
    }

    setIsLocating(true);
    setLocationMessage('正在取得目前位置…');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const position = { latitude: coords.latitude, longitude: coords.longitude };
      setUserPosition(position);
      setFocusedFavorite('');
      setOnlyFavorites(false);
      try {
        const area = await findTaiwanAdministrativeArea(position.latitude, position.longitude);
        if (!area) {
          setLocationMessage('已定位，但目前位置不在台灣縣市範圍內');
          return;
        }
        setCurrentCity(area.county);
        setCurrentTown('');
        setLocationMessage(`所在縣市：${area.county}`);
      } catch {
        setLocationMessage('已取得位置，但無法載入縣市界線資料');
      } finally {
        setIsLocating(false);
      }
    }, error => {
      const message = error.code === error.PERMISSION_DENIED
        ? '請允許瀏覽器存取位置以使用定位'
        : error.code === error.TIMEOUT
          ? '取得位置逾時，請再試一次'
          : '目前無法取得位置，請確認裝置定位已開啟';
      setLocationMessage(message);
      setIsLocating(false);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };
  const selectedStation = currentTown
    ? stations.find(station => station.county === currentCity && station.town === currentTown && station.temperature !== null)
    : undefined;
  const detailWeather = currentWeather && selectedStation ? {
    ...currentWeather,
    city: `${currentCity} ${currentTown}`,
    station_name: selectedStation.station_name,
    station_id: selectedStation.station_id,
    temperature: selectedStation.temperature,
    humidity: selectedStation.humidity ?? currentWeather.humidity,
    wind_speed: selectedStation.wind_speed ?? currentWeather.wind_speed,
    wind_direction: selectedStation.wind_direction ?? currentWeather.wind_direction,
    pressure: selectedStation.pressure ?? currentWeather.pressure,
    rain_1h: selectedStation.rain,
    uv_index: selectedStation.uv_index ?? currentWeather.uv_index,
    obs_time: selectedStation.obs_time
  } : currentWeather;
  const favoriteId = currentTown ? `${currentCity}|${currentTown}` : currentCity;
  const availableTowns = Array.from(new Set(stations.filter(s => s.county === currentCity && s.town).map(s => s.town))).sort();

  return (
    <div
      id="app-root"
      data-theme={theme}
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
    >

      {/* 1. Fullscreen Map Canvas Engine (Windy.com Style) */}
      <WindyMap
        stations={stations}
        overviewList={overviewList}
        currentCity={currentCity}
        currentTown={currentTown}
        focusedFavorite={focusedFavorite}
        onSelectCity={handleSelectCity}
        activeLayer={activeLayer}
        favorites={favorites}
        onlyFavorites={onlyFavorites}
        theme={theme}
        userPosition={userPosition}
        returnToTaiwanKey={returnToTaiwanKey}
        selectedAreaFocusKey={selectedAreaFocusKey}
      />

      {/* 2. Top-Left Floating Bar: Logo, City Dropdown, Favorite Filter, Quick City Pills */}
      <WindyTopBar
        currentCity={currentCity}
        currentTown={currentTown}
        weather={detailWeather}
        towns={availableTowns}
        focusedFavorite={focusedFavorite}
        onClearFocus={() => {
          setFocusedFavorite('');
          setOnlyFavorites(false);
          setReturnToTaiwanKey(key => key + 1);
        }}
        onSelectFavorite={handleSelectFavorite}
        onSelectCity={handleSelectCityFromDropdown}
        counties={ALL_COUNTIES}
        favorites={favorites}
        onlyFavorites={onlyFavorites}
        onToggleOnlyFavorites={() => {
          setFocusedFavorite('');
          setOnlyFavorites(value => !value);
        }}
        theme={theme}
        onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
        onLocate={handleLocate}
        onReturnToTaiwan={() => {
          setFocusedFavorite('');
          setOnlyFavorites(false);
          setReturnToTaiwanKey(key => key + 1);
        }}
        isLocating={isLocating}
        locationMessage={locationMessage}
        onRefresh={() => {
          loadGlobalData();
          loadCityWeather(currentCity);
        }}
        isLoading={isLoading || isCityLoading}
      />

      {/* 3. Top-Right Floating Alerts Widget (預警在右上) */}
      <WindyAlertsWidget
        alerts={focusedFavorite ? alerts.filter(alert => alert.city === focusedFavorite.split('|')[0]) : alerts}
        onSelectCity={handleSelectCity}
      />

      {/* 4. Right Sidebar: Layer Picker (溫度, 風速, 雨量, 濕度) */}
      <WindyLayerPicker
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
      />

      {/* 5. Left Floating Drawer: Weather Details, Metrics, Mini Chart, Star Favorite */}
      <WindyDetailPanel
        weather={detailWeather}
        isFavorite={favorites.includes(favoriteId)}
        onToggleFavorite={handleToggleFavorite}
        favoriteId={favoriteId}
      />

      {/* 6. Bottom Floating Dock: 36h Timeline, Color Scale Legend, City Carousel Strip */}
      <WindyBottomTimeline
        weather={currentWeather}
        overviewList={overviewList}
        favorites={favorites}
        onSelectCity={handleSelectSavedLocation}
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
