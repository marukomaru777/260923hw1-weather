const FAVORITES_STORAGE_KEY = 'taiwan_weather_favorites';
const DEFAULT_FAVORITES = ['臺北市', '臺中市', '高雄市'];

export function getLocalFavorites(): string[] {
  try {
    const data = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(DEFAULT_FAVORITES));
      return DEFAULT_FAVORITES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_FAVORITES;
  } catch (e) {
    console.error('Failed to read favorites from localStorage:', e);
    return DEFAULT_FAVORITES;
  }
}

export function saveLocalFavorites(favorites: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites to localStorage:', e);
  }
}

export function toggleLocalFavorite(city: string): string[] {
  const normCity = city.trim().replace('台', '臺');
  const current = getLocalFavorites();
  let updated: string[];
  if (current.includes(normCity)) {
    updated = current.filter(c => c !== normCity);
  } else {
    updated = [...current, normCity];
  }
  saveLocalFavorites(updated);
  return updated;
}
