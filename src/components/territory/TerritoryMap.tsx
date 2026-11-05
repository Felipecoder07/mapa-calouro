import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Circle,
  Marker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Territory, RecordingState, GeoPoint } from './types';
import { formatArea } from './geoUtils';

interface TerritoryMapProps {
  territories: Territory[];
  recording: RecordingState;
  selectedTerritory: Territory | null;
  onSelectTerritory: (territory: Territory | null) => void;
  currentUserLocation: GeoPoint | null;
  userColor?: string;
}

// Ícone de radar pulsante para a posição atual
function createPulsingUserIcon(color = '#10b981') {
  return L.divIcon({
    className: 'custom-pulse-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-8 h-8 rounded-full animate-ping opacity-60" style="background-color: ${color};"></div>
        <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-lg" style="background-color: ${color};"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Marcador do ponto de partida
function createStartPointIcon() {
  return L.divIcon({
    className: 'custom-start-marker',
    html: `
      <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-bold shadow-lg backdrop-blur-md">
        <span>🏁</span>
        <span>Início</span>
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
  });
}

// Badge no centro do território (Coroa / Bandeira + Nome)
function createTerritoryCenterIcon(territory: Territory) {
  const isTop1 = territory.courseId === 'cc';
  const iconSymbol = isTop1 ? '👑' : '🚩';

  return L.divIcon({
    className: 'custom-territory-badge',
    html: `
      <div class="flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-1/2">
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/85 border shadow-2xl backdrop-blur-md transition-transform hover:scale-110" style="border-color: ${territory.color};">
          <span class="text-xs">${iconSymbol}</span>
          <div class="flex flex-col text-left leading-tight">
            <span class="text-[11px] font-bold text-white tracking-wide">${territory.courseName}</span>
            <span class="text-[9px] text-gray-400 font-medium">${formatArea(territory.areaM2)}</span>
          </div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function calculateCentroid(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return [-4.9471, -37.9745];
  const latSum = coords.reduce((acc, c) => acc + c[0], 0);
  const lngSum = coords.reduce((acc, c) => acc + c[1], 0);
  return [latSum / coords.length, lngSum / coords.length];
}

// Controlador de foco e pan do mapa
function MapFollower({
  center,
  zoom,
  shouldFollow,
}: {
  center: [number, number] | null;
  zoom?: number;
  shouldFollow: boolean;
}) {
  const map = useMap();
  const prevCenterRef = useRef<string>('');

  useEffect(() => {
    if (!center || !shouldFollow) return;
    const key = `${center[0].toFixed(5)},${center[1].toFixed(5)}`;
    if (key !== prevCenterRef.current) {
      prevCenterRef.current = key;
      map.panTo(center, { animate: true, duration: 0.8 });
    }
  }, [center, shouldFollow, map]);

  useEffect(() => {
    if (zoom) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);

  return null;
}

export function TerritoryMap({
  territories,
  recording,
  selectedTerritory,
  onSelectTerritory,
  currentUserLocation,
  userColor = '#a855f7',
}: TerritoryMapProps) {
  const defaultCenter: [number, number] = [-4.9465, -37.9750];

  const recordedPositions: [number, number][] = useMemo(() => {
    return recording.points.map((p) => [p.lat, p.lng]);
  }, [recording.points]);

  const startPoint = recording.points.length > 0 ? recording.points[0] : null;
  const currentPos = recording.points.length > 0
    ? recording.points[recording.points.length - 1]
    : currentUserLocation;

  // Linha translúcida de projeção de fechamento até o ponto de partida
  const closingLinePositions: [number, number][] = useMemo(() => {
    if (!recording.isActive || !startPoint || !currentPos || recording.points.length < 3) return [];
    return [
      [currentPos.lat, currentPos.lng],
      [startPoint.lat, startPoint.lng],
    ];
  }, [recording.isActive, startPoint, currentPos, recording.points.length]);

  return (
    <div className="relative h-full w-full bg-[#0a0f1d]">
      <MapContainer
        center={defaultCenter}
        zoom={17}
        minZoom={14}
        maxZoom={19}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        {/* Camada de Mapa Escuro CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        {/* Centralizador / Seguidor automático de câmera */}
        <MapFollower
          center={
            recording.isActive && currentPos
              ? [currentPos.lat, currentPos.lng]
              : selectedTerritory
              ? calculateCentroid(selectedTerritory.coordinates)
              : null
          }
          shouldFollow={recording.isActive}
        />

        {/* Polígonos de Territórios Existentes */}
        {territories.map((territory) => {
          const isSelected = selectedTerritory?.id === territory.id;
          const centroid = calculateCentroid(territory.coordinates);

          return (
            <div key={territory.id}>
              <Polygon
                positions={territory.coordinates}
                pathOptions={{
                  color: territory.color,
                  fillColor: territory.color,
                  fillOpacity: isSelected ? 0.55 : 0.32,
                  weight: isSelected ? 3.5 : 2,
                  dashArray: isSelected ? '6, 6' : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectTerritory(territory),
                }}
              />
              <Marker
                position={centroid}
                icon={createTerritoryCenterIcon(territory)}
                eventHandlers={{
                  click: () => onSelectTerritory(territory),
                }}
              />
            </div>
          );
        })}

        {/* Trilha Ativa em Gravação */}
        {recording.isActive && recordedPositions.length > 1 && (
          <>
            {/* Brilho neon de fundo para a trilha */}
            <Polyline
              positions={recordedPositions}
              pathOptions={{
                color: userColor,
                weight: 8,
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Linha pontilhada principal */}
            <Polyline
              positions={recordedPositions}
              pathOptions={{
                color: '#10b981',
                weight: 3.5,
                opacity: 0.95,
                dashArray: '8, 6',
                lineCap: 'round',
              }}
            />
          </>
        )}

        {/* Projeção de Fechamento do Polígono */}
        {closingLinePositions.length === 2 && (
          <Polyline
            positions={closingLinePositions}
            pathOptions={{
              color: '#94a3b8',
              weight: 2,
              opacity: 0.5,
              dashArray: '4, 6',
            }}
          />
        )}

        {/* Zona de Fechamento em volta do ponto de partida (35 metros) */}
        {recording.isActive && startPoint && (
          <>
            <Circle
              center={[startPoint.lat, startPoint.lng]}
              radius={35}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
            <Marker
              position={[startPoint.lat, startPoint.lng]}
              icon={createStartPointIcon()}
            />
          </>
        )}

        {/* Marcador de Posição Atual (Radar Pulsante) */}
        {currentPos && (
          <Marker
            position={[currentPos.lat, currentPos.lng]}
            icon={createPulsingUserIcon(recording.isActive ? '#10b981' : userColor)}
          />
        )}
      </MapContainer>
    </div>
  );
}
