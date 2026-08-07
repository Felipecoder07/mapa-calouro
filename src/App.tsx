import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LocateFixed, Settings, Loader2, X, Route as RouteIcon, Footprints, Bike, Car, Clock, ChevronRight } from 'lucide-react';
import MapView from '@/components/MapView';
import Sidebar from '@/components/Sidebar';
import PlaceDetails from '@/components/PlaceDetails';
import Admin from '@/components/Admin';
import { UNIVERSITY } from '@/lib/constants';
import { fetchCategories, fetchPlaces, fetchReviewsForPlaces } from '@/lib/api';
import { haversineDistance, estimateDrivingTime, estimateWalkingTime, formatDistance, formatDuration } from '@/lib/distance';
import { fetchRoute, type RouteInfo, type RouteProfile } from '@/lib/mapUtils';
import type { PlaceWithMeta, Category } from '@/types';

const getCategoryEmoji = (category?: Category | null) => {
  if (!category) return '📍';
  const slug = category.slug;
  if (slug.includes('alimentacao')) return '🍽️';
  if (slug.includes('bibliotecas')) return '📚';
  if (slug.includes('predios') || slug.includes('salas')) return '🏢';
  if (slug.includes('laboratorios')) return '🔬';
  if (slug.includes('auditorios')) return '🎭';
  if (slug.includes('esportes')) return '⚽';
  if (slug.includes('xerox')) return '🖨️';
  if (slug.includes('estudo')) return '💻';
  return '📍';
};

// Painel deslizante (Bottom Sheet) para dispositivos móveis
function MobilePlacesSheet({
  isOpen,
  onClose,
  totalPlaces,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  totalPlaces: number;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const dragStartY = useRef(0);
  const currentDeltaY = useRef(0);
  const isExpandedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Animação suave de entrada do painel
  useEffect(() => {
    if (!isOpen) return;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.transform = 'translateY(100%)';
      requestAnimationFrame(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.36s cubic-bezier(0.32, 0.72, 0, 1), height 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
          sheetRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, [isOpen]);

  const handleAnimatedClose = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
      sheetRef.current.style.transform = 'translateY(100%)';
      setTimeout(onClose, 300);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      currentDeltaY.current = 0;
      isDraggingRef.current = true;
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !sheetRef.current) return;
      if (e.cancelable) e.preventDefault();

      const currentY = e.touches[0].clientY;
      const delta = currentY - dragStartY.current;
      currentDeltaY.current = delta;

      // Permite arrastar apenas para baixo (delta > 0) para manter a base fixa no rodapé da tela
      const clampedDelta = Math.max(0, delta);
      sheetRef.current.style.transform = `translateY(${clampedDelta}px)`;
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current || !sheetRef.current) return;
      isDraggingRef.current = false;
      const delta = currentDeltaY.current;

      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

      if (delta > 110) {
        // Arrastou para baixo além do limite -> fecha o painel
        sheetRef.current.style.transform = 'translateY(100%)';
        setTimeout(onClose, 300);
      } else {
        // Retorna para a posição inicial fixada no rodapé
        sheetRef.current.style.transform = 'translateY(0)';
      }
    };

    const dragHandle = dragHandleRef.current;
    const header = headerRef.current;

    if (dragHandle) {
      dragHandle.addEventListener('touchstart', handleTouchStart, { passive: true });
      dragHandle.addEventListener('touchmove', handleTouchMove, { passive: false });
      dragHandle.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    if (header) {
      header.addEventListener('touchstart', handleTouchStart, { passive: true });
      header.addEventListener('touchmove', handleTouchMove, { passive: false });
      header.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (dragHandle) {
        dragHandle.removeEventListener('touchstart', handleTouchStart);
        dragHandle.removeEventListener('touchmove', handleTouchMove);
        dragHandle.removeEventListener('touchend', handleTouchEnd);
      }
      if (header) {
        header.removeEventListener('touchstart', handleTouchStart);
        header.removeEventListener('touchmove', handleTouchMove);
        header.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] md:hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleAnimatedClose}
      />

      {/* Bottom Sheet container */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-10 flex flex-col bg-white rounded-t-3xl h-[88dvh] shadow-2xl overflow-hidden"
        style={{ willChange: 'transform', overscrollBehaviorY: 'contain' }}
      >
        {/* Touch Drag Handle Bar */}
        <div
          ref={dragHandleRef}
          className="flex w-full cursor-grab active:cursor-grabbing items-center justify-center py-2.5 touch-none flex-shrink-0 bg-white rounded-t-3xl z-10 border-b border-gray-50"
        >
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Header Bar */}
        <div
          ref={headerRef}
          className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 bg-white flex-shrink-0 touch-none"
        >
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-base font-bold text-gray-800">Explorar Locais</span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
              {totalPlaces}
            </span>
          </div>
          <button
            onClick={handleAnimatedClose}
            className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 active:scale-95 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function MapApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<PlaceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithMeta | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceOrigin, setDistanceOrigin] = useState<'university' | 'user'>('university');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<'university' | 'user' | null>(null);
  const [routeTargetPlace, setRouteTargetPlace] = useState<PlaceWithMeta | null>(null);
  const [activeProfile, setActiveProfile] = useState<RouteProfile>('foot');
  const [routing, setRouting] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // --- Navigation / live tracking state ---
  const [isFollowing, setIsFollowing] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const [suppressFit, setSuppressFit] = useState(false); // skip fitBounds on silent reroute
  const watchIdRef = useRef<number | null>(null);
  const lastReroutePos = useRef<{ lat: number; lng: number } | null>(null);

  const loadAll = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const [cats, pls] = await Promise.all([fetchCategories(), fetchPlaces()]);
      setCategories(cats);

      const placeIds = pls.map((p) => p.id);
      const reviewsMap = await fetchReviewsForPlaces(placeIds);

      const enriched: PlaceWithMeta[] = pls.map((p) => {
        const reviews = reviewsMap.get(p.id) ?? [];
        const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
        const distance = haversineDistance(UNIVERSITY.lat, UNIVERSITY.lng, p.lat, p.lng);
        const duration = estimateDrivingTime(distance);
        return {
          ...p,
          avgRating,
          reviewCount: reviews.length,
          distance,
          duration,
        };
      });

      setPlaces(enriched);
    } catch {
      if (!isSilent) {
        setError('Não foi possível carregar os dados. Verifique sua conexão.');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll, location.pathname]);

  const handleToggleCategory = (slug: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada neste dispositivo.');
      return;
    }
    setLocating(true);
    setLocationError(null);

    const tryGetPosition = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        (err) => {
          if (highAccuracy) {
            // Retry with standard accuracy (Wi-Fi/Cellular) if high accuracy times out
            tryGetPosition(false);
          } else {
            if (err.code === err.PERMISSION_DENIED) {
              alert('Permissão de GPS negada. Ative a localização nas configurações do seu navegador.');
            } else {
              alert('Não foi possível obter sua localização. Verifique se o GPS está ativado.');
            }
            setLocating(false);
          }
        },
        { enableHighAccuracy: highAccuracy, timeout: 7000, maximumAge: 10000 }
      );
    };

    tryGetPosition(true);
  };

  // --- Watch Position (continuous GPS) ---
  // Start watching when a route from the user is active; stop when route is cleared.
  useEffect(() => {
    const isNavigation = route !== null && routeOrigin === 'user';

    if (isNavigation && watchIdRef.current === null) {
      setArrived(false);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(newPos);

          const target = routeTargetPlace || selectedPlace;
          if (!target) return;

          // Distance remaining to destination (straight line × 1.25 street factor)
          const distToTarget = haversineDistance(newPos.lat, newPos.lng, target.lat, target.lng) * 1.25;

          // Arrived check: within 30 m
          if (distToTarget < 0.03) {
            setArrived(true);
            // Stop watching after arrival
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            return;
          }

          // Continuous update check: if user moves more than 15 m from the last reroute origin, recalculate
          const lastPos = lastReroutePos.current;
          const movedFar = !lastPos || haversineDistance(lastPos.lat, lastPos.lng, newPos.lat, newPos.lng) > 0.015;
          if (movedFar && !rerouting) {
            lastReroutePos.current = newPos;
            setRerouting(true);
            fetchRoute(newPos.lat, newPos.lng, target.lat, target.lng, activeProfile)
              .then((result) => {
                if (result) {
                  // Suppress fitBounds so the map doesn't jump during silent reroute
                  setSuppressFit(true);
                  setRoute(result);
                  setTimeout(() => setSuppressFit(false), 200);
                }
              })
              .finally(() => setRerouting(false));
          }
        },
        (err) => {
          console.warn('watchPosition error:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }

    // Stop watching when route is cleared or origin changes to 'university'
    if (!isNavigation && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsFollowing(false);
      setArrived(false);
    }

    return () => {
      // Cleanup on unmount
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, routeOrigin]);

  const handleRoute = async (
    origin: 'university' | 'user',
    profile: RouteProfile = activeProfile
  ) => {
    const target = selectedPlace || routeTargetPlace;
    if (!target) return;
    setRouteTargetPlace(target);

    const start =
      origin === 'university'
        ? { lat: UNIVERSITY.exitLat, lng: UNIVERSITY.exitLng }
        : userLocation;
    if (!start) return;

    setRouting(true);
    setRouteOrigin(origin);
    setActiveProfile(profile);

    const result = await fetchRoute(
      start.lat,
      start.lng,
      target.lat,
      target.lng,
      profile
    );

    setRouting(false);
    if (result) {
      setRoute(result);
    } else {
      const fallbackDist = haversineDistance(start.lat, start.lng, target.lat, target.lng);
      const fallbackDur = profile === 'foot' ? estimateWalkingTime(fallbackDist) : estimateDrivingTime(fallbackDist);
      setRoute({
        distance: fallbackDist,
        duration: fallbackDur,
        coordinates: [
          [start.lat, start.lng],
          [target.lat, target.lng],
        ],
        profile,
      });
    }
  };

  const handleClearRoute = () => {
    setRoute(null);
    setRouteOrigin(null);
    setRouteTargetPlace(null);
    setArrived(false);
    setIsFollowing(false);
    // Stop GPS watch when route is manually cleared
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleSelectPlace = (place: PlaceWithMeta) => {
    setMobileSidebarOpen(false);
    setSelectedPlace(place);
  };

  const toggleDistanceOrigin = () => {
    setDistanceOrigin((prev) => (prev === 'user' ? 'university' : 'user'));
  };

  const placesWithDistance = useMemo(() => {
    const isUserRef = distanceOrigin === 'user' && userLocation !== null;
    const refLat = isUserRef ? userLocation.lat : UNIVERSITY.lat;
    const refLng = isUserRef ? userLocation.lng : UNIVERSITY.lng;

    return places.map((p) => {
      // Apply 1.25x street factor to account for real street curves vs straight line
      const distance = haversineDistance(refLat, refLng, p.lat, p.lng) * 1.25;
      const duration = estimateDrivingTime(distance);
      return {
        ...p,
        distance,
        duration,
      };
    });
  }, [places, userLocation, distanceOrigin]);

  const filteredPlaces = useMemo(() => {
    let result = placesWithDistance;
    if (selectedCategories.size > 0) {
      result = result.filter((p) => p.category && selectedCategories.has(p.category.slug));
    }
    if (showFavoritesOnly) {
      const favs = JSON.parse(localStorage.getItem('mapa_calouros_favorites') ?? '[]');
      result = result.filter((p) => favs.includes(p.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [placesWithDistance, selectedCategories, searchQuery, showFavoritesOnly]);

  const isAdmin = location.pathname === '/painel-gestao-pet';

  if (isAdmin) {
    return <Admin onExit={() => navigate('/')} />;
  }

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-screen overflow-hidden bg-gray-50 select-none">
      {/* Sidebar - desktop */}
      <div className="hidden w-80 flex-shrink-0 border-r border-gray-100 md:block">
        <Sidebar
          places={filteredPlaces}
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
          userLocationActive={userLocation !== null}
          distanceOrigin={distanceOrigin}
          onToggleDistanceOrigin={toggleDistanceOrigin}
        />
      </div>

      {/* Mobile touch-draggable Bottom Sheet modal for Explorar Locais */}
      {mobileSidebarOpen && (
        <MobilePlacesSheet
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          totalPlaces={filteredPlaces.length}
        >
          <Sidebar
            places={filteredPlaces}
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => {
              handleSelectPlace(p);
              setMobileSidebarOpen(false);
            }}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
            userLocationActive={userLocation !== null}
            distanceOrigin={distanceOrigin}
            onToggleDistanceOrigin={toggleDistanceOrigin}
          />
        </MobilePlacesSheet>
      )}

      {/* Map area */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-3 text-sm text-gray-400">Carregando mapa...</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-500">{error}</p>
            <button onClick={() => loadAll()} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <MapView
              places={filteredPlaces}
              categories={categories}
              selectedPlace={selectedPlace}
              onSelectPlace={handleSelectPlace}
              userLocation={userLocation}
              route={route}
              routeOrigin={routeOrigin}
              isFollowing={isFollowing}
              suppressFit={suppressFit}
              onStopFollowing={() => setIsFollowing(false)}
            />

            {/* Top bar overlay */}
            <div className="pointer-events-none absolute left-3 right-3 top-3 z-[500] flex items-center justify-between">
              {/* Left — Brand Logo Pill */}
              <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md border border-gray-100 flex-shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                <div>
                  <h1 className="text-xs font-bold text-gray-900 leading-tight">Mapa do Calouro</h1>
                  <p className="text-[10px] font-medium text-gray-400 leading-tight">{UNIVERSITY.shortName} · Russas</p>
                </div>
              </div>

              {/* Right — Quick Actions Pill */}
              <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl bg-white/95 p-1.5 shadow-lg backdrop-blur-md border border-gray-100 flex-shrink-0">
                {/* Mobile-only: Locais button */}
                <button
                  onClick={() => {
                    setSelectedPlace(null);
                    setMobileSidebarOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 md:hidden"
                >
                  <span className="text-xs">🔍</span>
                  <span>Locais</span>
                </button>

                {/* GPS origin toggle */}
                {userLocation ? (
                  <div className="flex items-center gap-0.5 rounded-xl bg-gray-100/90 p-0.5 shadow-xs">
                    <button
                      onClick={() => setDistanceOrigin('user')}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        distanceOrigin === 'user'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Distâncias calculadas da sua posição física"
                    >
                      <span className="md:hidden">👤</span>
                      <span className="hidden md:inline">👤 Meu Local</span>
                    </button>
                    <button
                      onClick={() => setDistanceOrigin('university')}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        distanceOrigin === 'university'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Distâncias calculadas a partir da UFC Russas"
                    >
                      <span className="md:hidden">🏛️</span>
                      <span className="hidden md:inline">🏛️ Campus UFC</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLocate}
                    className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
                    title="Usar minha localização GPS"
                  >
                    {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                    <span className="hidden md:inline">Onde estou</span>
                  </button>
                )}
              </div>
            </div>

            {/* Location error toast */}
            {locationError && (
              <div className="absolute left-1/2 top-20 z-[600] -translate-x-1/2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-600 shadow-md animate-fade-in">
                {locationError}
                <button onClick={() => setLocationError(null)} className="ml-2 text-rose-400">
                  <X className="inline h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Arrived toast */}
            {arrived && (
              <div className="absolute left-1/2 top-20 z-[700] -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-xl animate-fade-in">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-bold text-sm">Você chegou!</p>
                  <p className="text-xs text-emerald-100">Destino atingido com sucesso.</p>
                </div>
                <button onClick={() => { setArrived(false); handleClearRoute(); }} className="ml-2 rounded-full bg-emerald-700 p-1 hover:bg-emerald-800 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}


            {/* Floating Route Banner — Positioned at top-16 center on mobile, and top-3 center on desktop (2 stacked rows) */}
            {route && routeOrigin && (
              <div className="absolute left-1/2 top-16 -translate-x-1/2 md:top-3 z-[600] flex flex-col items-center gap-1.5 rounded-2xl bg-white/95 p-2.5 shadow-xl backdrop-blur-md border border-gray-100/80 animate-fade-in-center w-[92%] max-w-sm md:w-auto md:max-w-max">
                {/* Row 1: Origin → Destination Path & Close Button */}
                <div className="relative flex items-center justify-center w-full min-h-[26px]">
                  <div className="flex items-center justify-center gap-1 min-w-0 max-w-[calc(100%-28px)] overflow-hidden">
                    <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] md:text-[11px] font-bold text-slate-700 whitespace-nowrap flex-shrink-0">
                      {routeOrigin === 'university' ? '🏛️ Campus UFC' : '👤 Meu Local'}
                    </span>
                    <span className="text-gray-400 font-bold text-xs flex-shrink-0">→</span>
                    <span className="truncate rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] md:text-[11px] font-bold text-blue-700 max-w-[160px] md:max-w-[220px]">
                      📍 {(routeTargetPlace || selectedPlace)?.name || 'Destino'}
                    </span>
                  </div>

                  <button
                    onClick={handleClearRoute}
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    title="Fechar rota"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Row 2: Controls, Distance/Time Badge & Follow toggle */}
                <div className="flex items-center justify-center gap-1.5 w-full pt-1.5 border-t border-gray-100/80">
                  {/* Mode switcher tabs */}
                  <div className="flex items-center gap-0.5 rounded-xl bg-gray-100/90 p-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleRoute(routeOrigin, 'foot')}
                      className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold whitespace-nowrap transition ${
                        route.profile === 'foot' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Modo Pedestre (A pé)"
                    >
                      <Footprints className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">A pé</span>
                    </button>

                    <button
                      onClick={() => handleRoute(routeOrigin, 'driving')}
                      className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold whitespace-nowrap transition ${
                        route.profile === 'driving' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Modo Automóvel (Carro/Moto)"
                    >
                      <Car className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">Carro</span>
                    </button>
                  </div>

                  {/* Distance & Duration Badge */}
                  {(() => {
                    const target = routeTargetPlace || selectedPlace;
                    const bannerDist = target
                      ? haversineDistance(
                          routeOrigin === 'user' && userLocation ? userLocation.lat : UNIVERSITY.lat,
                          routeOrigin === 'user' && userLocation ? userLocation.lng : UNIVERSITY.lng,
                          target.lat,
                          target.lng
                        ) * 1.25
                      : route.distance;
                    const bannerDur = route.profile === 'foot' ? estimateWalkingTime(bannerDist) : estimateDrivingTime(bannerDist);
                    return (
                      <div className="flex items-center gap-1 rounded-xl bg-blue-50/80 px-2 py-0.5 text-xs font-semibold text-blue-900 border border-blue-100/80 shadow-2xs whitespace-nowrap flex-shrink-0">
                        <span className="flex items-center gap-1 whitespace-nowrap font-medium text-blue-700">
                          <Clock className="h-3 w-3 text-blue-600 flex-shrink-0" />
                          <span>{formatDuration(bannerDur)}</span>
                        </span>
                        <span className="text-blue-300 font-bold">·</span>
                        <span className="whitespace-nowrap font-bold text-blue-800">{formatDistance(bannerDist)}</span>
                      </div>
                    );
                  })()}

                  {/* Follow toggle — only when navigating from user location */}
                  {routeOrigin === 'user' && (
                    <button
                      onClick={() => setIsFollowing((f) => !f)}
                      className={`flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold transition ${
                        isFollowing
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isFollowing ? 'Parar de seguir sua posição' : 'Mapa segue sua posição'}
                    >
                      <LocateFixed className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">{isFollowing ? 'Seguindo' : 'Seguir'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Routing loader */}
            {routing && (
              <div className="absolute left-1/2 top-20 z-[600] -translate-x-1/2 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-lg border border-gray-100">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Calculando menor caminho no trânsito...</span>
              </div>
            )}

            {/* Place details panel */}
            <PlaceDetails
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              onRoute={handleRoute}
              hasActiveRoute={route != null}
              onClearRoute={handleClearRoute}
              userLocation={userLocation}
            />
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<MapApp />} />
      </Routes>
    </HashRouter>
  );
}
