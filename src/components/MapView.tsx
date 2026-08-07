import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import { UNIVERSITY } from '@/lib/constants';
import {
  createCategoryIcon,
  createUniversityIcon,
  createUserLocationIcon,
  type RouteInfo,
} from '@/lib/mapUtils';
import type { PlaceWithMeta, Category } from '@/types';
import { formatDistance, formatDuration, haversineDistance } from '@/lib/distance';

interface MapViewProps {
  places: PlaceWithMeta[];
  categories: Category[];
  selectedPlace: PlaceWithMeta | null;
  onSelectPlace: (place: PlaceWithMeta) => void;
  userLocation: { lat: number; lng: number } | null;
  route: RouteInfo | null;
  routeOrigin: 'university' | 'user' | null;
  onMapReady?: (map: L.Map) => void;
  isFollowing?: boolean;
  suppressFit?: boolean; // when true, skip fitBounds (used on silent reroutes)
  onStopFollowing?: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  alimentacao: '🍽️',
  bibliotecas: '📚',
  'salas-predios': '🏢',
  convivencia: '☕',
  academias: '💪',
  esportes: '⚽',
  mercados: '🛒',
  'saude-farmacias': '💊',
  moradias: '🏠',
  servicos: '🖨️',
  transporte: '🚌',
  'igrejas-templos': '⛪',
  restaurantes: '🍽️',
  lanchonetes: '🍔',
  farmacias: '💊',
  hospitais: '🏥',
  papelarias: '✏️',
  bancos: '🏦',
  outros: '🏪',
};

const ICON_EMOJIS: Record<string, string> = {
  Utensils: '🍽️',
  BookOpen: '📚',
  Building2: '🏢',
  Coffee: '☕',
  Dumbbell: '💪',
  Trophy: '⚽',
  ShoppingCart: '🛒',
  Pill: '💊',
  Home: '🏠',
  Printer: '🖨️',
  Bus: '🚌',
  Church: '⛪',
  Cross: '✝️',
  HelpCircle: '🖨️',
};

import { getCategoryEmoji } from '@/lib/icons';

function getEmojiForCategory(category?: Category): string {
  return getCategoryEmoji(category);
}

function MapController({
  selectedPlace,
  userLocation,
  route,
  isFollowing,
  suppressFit,
  onStopFollowing,
}: {
  selectedPlace: PlaceWithMeta | null;
  userLocation: { lat: number; lng: number } | null;
  route: RouteInfo | null;
  isFollowing?: boolean;
  suppressFit?: boolean;
  onStopFollowing?: () => void;
}) {
  const map = useMap();
  const prevSelectedId = useRef<string | null>(null);
  const hasCenteredUserRef = useRef<boolean>(false);
  const didFitRouteRef = useRef<string | null>(null);

  // Stop following mode immediately if the user manually drags the map (like Google Maps)
  useMapEvents({
    dragstart() {
      if (isFollowing && onStopFollowing) {
        onStopFollowing();
      }
    },
  });

  useEffect(() => {
    if (route && route.coordinates.length > 0) {
      const first = route.coordinates[0];
      const last = route.coordinates[route.coordinates.length - 1];
      const routeKey = `${first}-${last}`;
      if (didFitRouteRef.current === routeKey) return;
      didFitRouteRef.current = routeKey;
      if (suppressFit) return;
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, { padding: [90, 90], maxZoom: 16.5, animate: true });
    } else if (!route) {
      didFitRouteRef.current = null;
    }
  }, [route, map, suppressFit]);

  // Fly to selected place ONLY when a new place is clicked
  useEffect(() => {
    if (selectedPlace && selectedPlace.id !== prevSelectedId.current) {
      prevSelectedId.current = selectedPlace.id;
      map.stop();
      map.closePopup();
      const targetZoom = Math.max(map.getZoom(), 17);
      map.flyTo([selectedPlace.lat, selectedPlace.lng], targetZoom, { duration: 0.8 });
    } else if (!selectedPlace) {
      prevSelectedId.current = null;
    }
  }, [selectedPlace, map]);

  // Move to user location ONLY ONCE when location is first acquired
  useEffect(() => {
    if (userLocation && !hasCenteredUserRef.current && !selectedPlace && !route) {
      hasCenteredUserRef.current = true;
      map.setView([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 15));
    }
  }, [userLocation, selectedPlace, route, map]);

  // Live follow: smoothly pan to user position ONLY when isFollowing is active
  useEffect(() => {
    if (isFollowing && userLocation) {
      map.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 0.5 });
    }
  }, [isFollowing, userLocation, map]);

  return null;
}

// Dynamically updates map maxZoom on the Leaflet map instance when base layers change
function DynamicZoomLimit() {
  const map = useMap();

  useEffect(() => {
    const handleBaseLayerChange = (e: L.LayersControlEvent) => {
      if (e.name.includes('Satélite')) {
        map.setMaxZoom(18);
        if (map.getZoom() > 18) {
          map.setZoom(18);
        }
      } else {
        map.setMaxZoom(22);
      }
    };

    map.on('baselayerchange', handleBaseLayerChange);
    return () => {
      map.off('baselayerchange', handleBaseLayerChange);
    };
  }, [map]);

  return null;
}

export default function MapView({
  places,
  categories,
  selectedPlace,
  onSelectPlace,
  userLocation,
  route,
  routeOrigin,
  onMapReady,
  isFollowing,
  suppressFit,
  onStopFollowing,
}: MapViewProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Trim polyline points behind user location when navigating from userLocation
  const activeRoutePositions = useMemo<L.LatLngTuple[]>(() => {
    if (!route || route.coordinates.length === 0) return [];
    if (routeOrigin === 'user' && userLocation) {
      let minDistance = Infinity;
      let closestIdx = 0;
      route.coordinates.forEach((pt, idx) => {
        const d = haversineDistance(userLocation.lat, userLocation.lng, pt[0], pt[1]);
        if (d < minDistance) {
          minDistance = d;
          closestIdx = idx;
        }
      });
      return [[userLocation.lat, userLocation.lng], ...route.coordinates.slice(closestIdx)] as L.LatLngTuple[];
    }
    return route.coordinates as L.LatLngTuple[];
  }, [route, routeOrigin, userLocation]);

  return (
    <MapContainer
      center={[UNIVERSITY.lat, UNIVERSITY.lng]}
      zoom={16}
      maxZoom={22}
      minZoom={1}
      bounceAtZoomLimits={false}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
      ref={(map) => {
        if (map && onMapReady) onMapReady(map);
      }}
    >
      <DynamicZoomLimit />
      <LayersControl position="bottomright">
        <LayersControl.BaseLayer checked name="🗺️ Mapa Padrão (Vetor)">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxNativeZoom={19}
            maxZoom={22}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="🛰️ Satélite HD (ArcGIS/Esri)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            maxZoom={18}
            maxNativeZoom={18}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="🌙 Modo Escuro (CartoDB Dark)">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            maxNativeZoom={19}
            maxZoom={22}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="🏢 Modo Claro Minimalista (CartoDB Light)">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            maxNativeZoom={19}
            maxZoom={22}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapController
        selectedPlace={selectedPlace}
        userLocation={userLocation}
        route={route}
        isFollowing={isFollowing}
        suppressFit={suppressFit}
        onStopFollowing={onStopFollowing}
      />

      <Marker
        position={[UNIVERSITY.lat, UNIVERSITY.lng]}
        icon={createUniversityIcon()}
        zIndexOffset={1000}
      >
        <Popup closeButton={false}>
          <div className="text-center">
            <strong className="text-blue-700">{UNIVERSITY.shortName}</strong>
            <br />
            <span className="text-xs text-gray-600">{UNIVERSITY.name}</span>
          </div>
        </Popup>
      </Marker>

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={createUserLocationIcon()}
          zIndexOffset={900}
        >
          <Popup closeButton={false}>
            <strong>Sua localização</strong>
          </Popup>
        </Marker>
      )}

      {places.map((place) => {
        const category = place.category ?? categoryMap.get(place.category_id);
        const emoji = getEmojiForCategory(category);
        const isSelected = selectedPlace?.id === place.id;

        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={createCategoryIcon(category?.color ?? '#78716c', emoji)}
            zIndexOffset={isSelected ? 800 : 0}
            eventHandlers={{
              click: (e) => {
                const mapInstance = e.target._map;
                if (mapInstance) {
                  mapInstance.stop();
                  mapInstance.flyTo([place.lat, place.lng], Math.max(mapInstance.getZoom(), 17), { duration: 0.8 });
                }
              },
            }}
          >
            <Popup closeButton={false} autoPan={false}>
              <div className="min-w-[170px] p-0.5">
                <strong className="text-sm text-gray-900 leading-tight block mb-0.5">{place.name}</strong>
                <span className="text-xs text-gray-500 font-medium">{category?.name}</span>

                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                  {place.distance != null ? (
                    <span className="text-xs text-blue-600 font-bold">
                      {formatDistance(place.distance)}
                    </span>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlace(place);
                    }}
                    className="flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    <span>Ver detalhes</span>
                    <span className="text-xs">➔</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {route && activeRoutePositions.length > 0 && (
        <>
          {/* Casing / Glow line */}
          <Polyline
            positions={activeRoutePositions}
            pathOptions={{ color: '#1d4ed8', weight: 8, opacity: 0.35, lineCap: 'round', lineJoin: 'round' }}
          />
          {/* Main solid vibrant blue route line */}
          <Polyline
            positions={activeRoutePositions}
            pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
          />
        </>
      )}

      {route && routeOrigin && (
        <Marker
          position={
            routeOrigin === 'university'
              ? [UNIVERSITY.lat, UNIVERSITY.lng]
              : userLocation
                ? [userLocation.lat, userLocation.lng]
                : [UNIVERSITY.lat, UNIVERSITY.lng]
          }
          icon={createUserLocationIcon()}
        />
      )}
    </MapContainer>
  );
}
