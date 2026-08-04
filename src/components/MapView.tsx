import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
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
import { formatDistance, formatDuration } from '@/lib/distance';

interface MapViewProps {
  places: PlaceWithMeta[];
  categories: Category[];
  selectedPlace: PlaceWithMeta | null;
  onSelectPlace: (place: PlaceWithMeta) => void;
  userLocation: { lat: number; lng: number } | null;
  route: RouteInfo | null;
  routeOrigin: 'university' | 'user' | null;
  onMapReady?: (map: L.Map) => void;
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

function getEmojiForCategory(category?: Category): string {
  if (!category) return '📍';
  if (CATEGORY_EMOJIS[category.slug]) return CATEGORY_EMOJIS[category.slug];
  if (ICON_EMOJIS[category.icon]) return ICON_EMOJIS[category.icon];
  return '📍';
}

function MapController({
  selectedPlace,
  userLocation,
  route,
}: {
  selectedPlace: PlaceWithMeta | null;
  userLocation: { lat: number; lng: number } | null;
  route: RouteInfo | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (route && route.coordinates.length > 0) {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [route, map]);

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo([selectedPlace.lat, selectedPlace.lng], 16, { duration: 0.8 });
    }
  }, [selectedPlace, map]);

  useEffect(() => {
    if (userLocation && !selectedPlace && !route) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [userLocation, map]);

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
}: MapViewProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  return (
    <MapContainer
      center={[UNIVERSITY.lat, UNIVERSITY.lng]}
      zoom={16}
      className="h-full w-full"
      zoomControl={false}
      ref={(map) => {
        if (map && onMapReady) onMapReady(map);
      }}
    >
      <LayersControl position="bottomright">
        <LayersControl.BaseLayer checked name="🗺️ Mapa Padrão (Vetor)">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="🛰️ Satélite HD (ArcGIS/Esri)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="🌙 Modo Escuro (CartoDB Dark)">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="🏢 Modo Claro Minimalista (CartoDB Light)">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapController selectedPlace={selectedPlace} userLocation={userLocation} route={route} />

      <Marker
        position={[UNIVERSITY.lat, UNIVERSITY.lng]}
        icon={createUniversityIcon()}
        zIndexOffset={1000}
      >
        <Popup>
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
          <Popup>
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
              click: () => onSelectPlace(place),
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <strong className="text-sm">{place.name}</strong>
                <br />
                <span className="text-xs text-gray-500">{category?.name}</span>
                {place.distance != null && (
                  <div className="mt-1 text-xs text-blue-600 font-medium">
                    {formatDistance(place.distance)}
                    {place.duration != null && ` · ${formatDuration(place.duration)}`}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {route && route.coordinates.length > 0 && (
        <>
          {/* Casing / Glow line */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{ color: '#1d4ed8', weight: 8, opacity: 0.35, lineCap: 'round', lineJoin: 'round' }}
          />
          {/* Main solid vibrant blue route line */}
          <Polyline
            positions={route.coordinates}
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
