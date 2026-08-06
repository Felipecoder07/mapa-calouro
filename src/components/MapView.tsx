import { useEffect, useMemo, useRef } from 'react';
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

import { getCategoryEmoji } from '@/lib/icons';

function getEmojiForCategory(category?: Category): string {
  return getCategoryEmoji(category);
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
  const prevSelectedId = useRef<string | null>(null);
  const prevUserLocation = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (route && route.coordinates.length > 0) {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, {
        padding: [90, 90],
        maxZoom: 16.5, // Prevents over-zooming on short campus routes
        animate: true,
      });
    }
  }, [route, map]);

  // Fly to selected place ONLY when a new place is clicked (prevents resetting user zoom on re-render)
  useEffect(() => {
    if (selectedPlace && selectedPlace.id !== prevSelectedId.current) {
      prevSelectedId.current = selectedPlace.id;
      const targetZoom = Math.max(map.getZoom(), 16);
      map.flyTo([selectedPlace.lat, selectedPlace.lng], targetZoom, { duration: 0.8 });
    } else if (!selectedPlace) {
      prevSelectedId.current = null;
    }
  }, [selectedPlace, map]);

  // Move to user location ONLY once when location is acquired
  useEffect(() => {
    if (userLocation && !selectedPlace && !route && userLocation !== prevUserLocation.current) {
      prevUserLocation.current = userLocation;
      map.setView([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 15));
    }
  }, [userLocation, selectedPlace, route, map]);

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
      maxZoom={22}
      minZoom={12}
      bounceAtZoomLimits={false}
      zoomSnap={0.5}
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
