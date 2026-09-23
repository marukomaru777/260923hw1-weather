interface AdministrativeFeature {
  properties?: {
    COUNTYNAME?: string;
    TOWNNAME?: string;
  };
  geometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][][] | number[][][];
  };
}

interface AdministrativeArea {
  county: string;
  town: string;
}

function pointInRing(longitude: number, latitude: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = (yi > latitude) !== (yj > latitude) &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function polygonContains(longitude: number, latitude: number, rings: number[][][]): boolean {
  return Boolean(rings.length) &&
    pointInRing(longitude, latitude, rings[0]) &&
    !rings.slice(1).some(ring => pointInRing(longitude, latitude, ring));
}

function featureContains(feature: AdministrativeFeature, longitude: number, latitude: number): boolean {
  const geometry = feature.geometry;
  if (!geometry) return false;
  if (geometry.type === 'Polygon') {
    return polygonContains(longitude, latitude, geometry.coordinates as number[][][]);
  }
  return (geometry.coordinates as number[][][][]).some(polygon =>
    polygonContains(longitude, latitude, polygon)
  );
}

export async function findTaiwanAdministrativeArea(
  latitude: number,
  longitude: number
): Promise<AdministrativeArea | null> {
  const response = await fetch('/taiwan-townships.geojson');
  if (!response.ok) throw new Error(`行政區資料載入失敗 (${response.status})`);
  const geojson = await response.json() as { features?: AdministrativeFeature[] };
  const feature = geojson.features?.find(item => featureContains(item, longitude, latitude));
  const county = feature?.properties?.COUNTYNAME;
  if (!county) return null;
  return { county, town: feature?.properties?.TOWNNAME ?? '' };
}
