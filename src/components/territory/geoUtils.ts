import type { GeoPoint } from './types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calcula a distância Haversine em metros entre duas coordenadas
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calcula a distância total percorrida em metros
 */
export function calculateTotalDistance(points: (GeoPoint | [number, number])[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = Array.isArray(points[i])
      ? { lat: (points[i] as [number, number])[0], lng: (points[i] as [number, number])[1] }
      : (points[i] as GeoPoint);
    const p2 = Array.isArray(points[i + 1])
      ? { lat: (points[i + 1] as [number, number])[0], lng: (points[i + 1] as [number, number])[1] }
      : (points[i + 1] as GeoPoint);

    total += haversineDistanceMeters(p1.lat, p1.lng, p2.lat, p2.lng);
  }
  return total;
}

/**
 * Calcula a área de um polígono esférico/geodésico em metros quadrados (m²)
 */
export function calculateGeodesicArea(coords: (GeoPoint | [number, number])[]): number {
  if (coords.length < 3) return 0;

  const pts: [number, number][] = coords.map((c) =>
    Array.isArray(c) ? [c[0], c[1]] : [c.lat, c.lng]
  );

  // Projeção azimutal equidistante / equirretangular local centrada no centróide
  const centerLat = pts.reduce((acc, p) => acc + p[0], 0) / pts.length;
  const centerLng = pts.reduce((acc, p) => acc + p[1], 0) / pts.length;
  const latRad = (centerLat * Math.PI) / 180;

  // Conversão para coordenadas métricas cartesianas locais
  const xy = pts.map(([lat, lng]) => {
    const y = ((lat - centerLat) * Math.PI * EARTH_RADIUS_METERS) / 180;
    const x = ((lng - centerLng) * Math.PI * EARTH_RADIUS_METERS * Math.cos(latRad)) / 180;
    return { x, y };
  });

  // Fórmula de Shoelace (Gauss Area)
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    area += xy[i].x * xy[j].y;
    area -= xy[j].x * xy[i].y;
  }

  return Math.abs(area) / 2;
}

/**
 * Verifica se o circuito foi fechado (retornou próximo ao início)
 */
export function isCircuitClosed(
  points: GeoPoint[],
  thresholdMeters = 35
): { isClosed: boolean; distanceToStart: number } {
  if (points.length < 4) {
    return { isClosed: false, distanceToStart: 999 };
  }

  const start = points[0];
  const current = points[points.length - 1];
  const distanceToStart = haversineDistanceMeters(start.lat, start.lng, current.lat, current.lng);

  // Precisa ter caminhado pelo menos 60 metros no total para não fechar logo no 2º passo
  const totalWalked = calculateTotalDistance(points);

  const isClosed = totalWalked >= 50 && distanceToStart <= thresholdMeters;

  return { isClosed, distanceToStart };
}

/**
 * Formata área em m² ou km²
 */
export function formatArea(areaM2: number): string {
  if (areaM2 >= 10000) {
    const km2 = areaM2 / 1000000;
    return `${km2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km²`;
  }
  return `${Math.round(areaM2).toLocaleString('pt-BR')} m²`;
}

/**
 * Formata distância
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formata tempo em MM:SS
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Converte coordenadas de polígono geográfico para SVG Path normalizado (para exibir a silhueta no modal de vitória)
 */
export function generateSvgPolygonPath(
  coords: [number, number][],
  width = 160,
  height = 120,
  padding = 16
): string {
  if (!coords || coords.length < 3) return '';

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  coords.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  const latSpan = maxLat - minLat || 0.0001;
  const lngSpan = maxLng - minLng || 0.0001;

  const w = width - padding * 2;
  const h = height - padding * 2;

  const points = coords.map(([lat, lng]) => {
    // Inverter lat porque no SVG o Y cresce para baixo
    const x = padding + ((lng - minLng) / lngSpan) * w;
    const y = padding + ((maxLat - lat) / latSpan) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${points.join(' L ')} Z`;
}
