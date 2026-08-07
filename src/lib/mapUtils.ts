import L from 'leaflet';
import { OSRM_BASE } from './constants';

// Criação de marcadores personalizados por categoria
export function createCategoryIcon(color: string, emoji: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); font-size: 16px; line-height: 1;">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// Marcador especial em destaque para a Universidade Federal do Ceará
export function createUniversityIcon(): L.DivIcon {
  return L.divIcon({
    className: 'university-marker',
    html: `
      <div style="
        background-color: #1e40af;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

// Marcador azul pulso para a posição em tempo real do usuário
export function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        background-color: #2563eb;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export type RouteProfile = 'foot' | 'bike' | 'driving';

export interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: [number, number][];
  profile: RouteProfile;
}

// Requisição de cálculo de rotas urbanas via API OSRM
export async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  profile: RouteProfile = 'foot'
): Promise<RouteInfo | null> {
  let osrmProfile = 'foot';
  if (profile === 'bike') {
    osrmProfile = 'bike';
  } else if (profile === 'driving') {
    osrmProfile = 'car';
  }

  const url = `${OSRM_BASE}/route/v1/${osrmProfile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    return {
      distance: route.distance / 1000,
      duration: route.duration / 60,
      coordinates,
      profile,
    };
  } catch {
    return null;
  }
}
