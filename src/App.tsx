import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LocateFixed, Settings, Loader2, X, Route as RouteIcon, Footprints, Bike, Car } from 'lucide-react';
import MapView from '@/components/MapView';
import Sidebar from '@/components/Sidebar';
import PlaceDetails from '@/components/PlaceDetails';
import Admin from '@/components/Admin';
import { UNIVERSITY } from '@/lib/constants';
import { fetchCategories, fetchPlaces, fetchReviewsForPlaces } from '@/lib/api';
import { haversineDistance, estimateDrivingTime, formatDistance, formatDuration } from '@/lib/distance';
import { fetchRoute, type RouteInfo, type RouteProfile } from '@/lib/mapUtils';
import type { PlaceWithMeta, Category } from '@/types';

// Mobile touch-draggable Bottom Sheet for Explorar Locais
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

  // Smooth entrance animation
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

      if (delta < 0) {
        if (isExpandedRef.current) {
          const dampened = delta * 0.2;
          sheetRef.current.style.transform = `translateY(${dampened}px)`;
        } else {
          sheetRef.current.style.transform = `translateY(${delta}px)`;
        }
      } else {
        sheetRef.current.style.transform = `translateY(${delta}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current || !sheetRef.current) return;
      isDraggingRef.current = false;
      const delta = currentDeltaY.current;

      sheetRef.current.style.transition = 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), height 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

      if (delta > 110) {
        sheetRef.current.style.transform = 'translateY(100%)';
        setTimeout(onClose, 300);
      } else if (delta < -50 && !isExpandedRef.current) {
        isExpandedRef.current = true;
        sheetRef.current.style.height = '90dvh';
        sheetRef.current.style.transform = 'translateY(0)';
      } else if (delta > 50 && isExpandedRef.current) {
        isExpandedRef.current = false;
        sheetRef.current.style.height = '75dvh';
        sheetRef.current.style.transform = 'translateY(0)';
      } else {
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
        className="fixed inset-x-0 bottom-0 z-10 flex flex-col bg-white rounded-t-3xl h-[75dvh] shadow-2xl overflow-hidden"
        style={{ willChange: 'transform, height', overscrollBehaviorY: 'contain' }}
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
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<'university' | 'user' | null>(null);
  const [routeTargetPlace, setRouteTargetPlace] = useState<PlaceWithMeta | null>(null);
  const [activeProfile, setActiveProfile] = useState<RouteProfile>('foot');
  const [routing, setRouting] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    const interval = setInterval(() => {
      loadAll(true); // Silent 10-second background refresh for new places/categories
    }, 10000);
    return () => clearInterval(interval);
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
      const fallbackDur = estimateDrivingTime(fallbackDist);
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
  };

  const handleSelectPlace = (place: PlaceWithMeta) => {
    setMobileSidebarOpen(false);
    setSelectedPlace(place);
    handleClearRoute();
  };

  const placesWithDistance = useMemo(() => {
    const refLat = userLocation ? userLocation.lat : UNIVERSITY.lat;
    const refLng = userLocation ? userLocation.lng : UNIVERSITY.lng;

    return places.map((p) => {
      const distance = haversineDistance(refLat, refLng, p.lat, p.lng);
      const duration = estimateDrivingTime(distance);
      return {
        ...p,
        distance,
        duration,
      };
    });
  }, [places, userLocation]);

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

  const isAdmin = location.pathname === '/admin';

  if (isAdmin) {
    return <Admin onExit={() => navigate('/')} />;
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar - desktop */}
      <div className="hidden w-80 flex-shrink-0 border-r border-gray-100 md:block">
        <Sidebar
          places={placesWithDistance}
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
        />
      </div>

      {/* Mobile touch-draggable Bottom Sheet modal for Explorar Locais */}
      {mobileSidebarOpen && (
        <MobilePlacesSheet
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          totalPlaces={placesWithDistance.length}
        >
          <Sidebar
            places={placesWithDistance}
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
            />

            {/* Top bar overlay */}
            <div className="pointer-events-none absolute left-3 right-3 top-3 z-[500] flex items-center justify-between">
              {/* Brand Logo Pill */}
              <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-md border border-gray-100">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                <div>
                  <h1 className="text-xs font-bold text-gray-900 leading-tight">Mapa do Calouro</h1>
                  <p className="text-[10px] font-medium text-gray-400 leading-tight">{UNIVERSITY.shortName} · Russas</p>
                </div>
              </div>

              {/* Quick Actions Group */}
              <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl bg-white/95 p-1.5 shadow-lg backdrop-blur-md border border-gray-100">
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

                <button
                  onClick={handleLocate}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold shadow-xs transition ${
                    userLocation
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Usar minha localização"
                >
                  {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{userLocation ? 'Localizado' : 'Onde estou'}</span>
                </button>

                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
                  title="Painel administrativo"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
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

            {/* Dynamic Route Info Banner */}
            {route && routeOrigin && (selectedPlace || routeTargetPlace) && (
              <div className="absolute left-1/2 top-20 z-[600] -translate-x-1/2 flex flex-col sm:flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl border border-gray-100 animate-fade-in">
                <div className="flex items-center gap-2">
                  <RouteIcon className="h-5 w-5 text-blue-600" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-semibold text-gray-800">
                      {routeOrigin === 'university' ? 'Da UFC Russas' : 'De você'}
                    </span>
                    <span className="mx-1 text-gray-300">→</span>
                    <span className="font-semibold text-gray-800">
                      {(selectedPlace || routeTargetPlace)?.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-3">
                  {/* Mode switcher tabs */}
                  <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
                    <button
                      onClick={() => handleRoute(routeOrigin, 'foot')}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        route.profile === 'foot'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Modo Pedestre (A pé)"
                    >
                      <Footprints className="h-3.5 w-3.5" />
                      A pé
                    </button>
                    <button
                      onClick={() => handleRoute(routeOrigin, 'driving')}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        route.profile === 'driving'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Modo Automóvel (Carro/Moto)"
                    >
                      <Car className="h-3.5 w-3.5" />
                      Automóvel
                    </button>
                  </div>

                  <div className="text-xs font-bold text-blue-600 ml-1">
                    {formatDistance(route.distance)} · {formatDuration(route.duration)}
                  </div>

                  <button onClick={handleClearRoute} className="ml-1 rounded-lg p-1 text-gray-400 hover:bg-gray-100" title="Fechar rota">
                    <X className="h-4 w-4" />
                  </button>
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
