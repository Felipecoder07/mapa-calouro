import { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Star,
  MapPin,
  Clock,
  Phone,
  Navigation,
  Heart,
  Send,
  Loader2,
  ExternalLink,
  Route,
  Footprints,
  Bike,
  Car,
} from 'lucide-react';
import { getCategoryIcon } from '@/lib/icons';
import { UNIVERSITY } from '@/lib/constants';
import { formatDistance, formatDuration, estimateWalkingTime, estimateDrivingTime, haversineDistance } from '@/lib/distance';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { fetchReviews, addReview } from '@/lib/api';
import type { RouteProfile } from '@/lib/mapUtils';
import type { PlaceWithMeta, Review } from '@/types';

interface PlaceDetailsProps {
  place: PlaceWithMeta | null;
  onClose: () => void;
  onRoute: (origin: 'university' | 'user', profile: RouteProfile) => void;
  hasActiveRoute: boolean;
  onClearRoute: () => void;
  userLocation: { lat: number; lng: number } | null;
}

export default function PlaceDetails({
  place,
  onClose,
  onRoute,
  hasActiveRoute,
  onClearRoute,
  userLocation,
}: PlaceDetailsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [fav, setFav] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ author: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<RouteProfile>('foot');
  const [selectedOrigin, setSelectedOrigin] = useState<'university' | 'user'>('university');

  // Mobile Bottom Sheet Refs (Direct DOM Manipulation for 60fps smoothness)
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const dragStartY = useRef(0);
  const currentDeltaY = useRef(0);
  const isExpandedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Animated close helper: slides down before triggering onClose()
  const handleAnimatedClose = () => {
    if (sheetRef.current && window.innerWidth < 768) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
      sheetRef.current.style.transform = 'translateY(100%)';
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };

  // Smooth entrance animation ONLY when a NEW place is selected (prevents flickering on background polling)
  useEffect(() => {
    if (!place) return;
    if (sheetRef.current && window.innerWidth < 768) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.transform = 'translateY(100%)';
      requestAnimationFrame(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.36s cubic-bezier(0.32, 0.72, 0, 1), height 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
          sheetRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, [place?.id]);

  // Attach native touch event listeners to drag handle & header bar (runs outside React state updates)
  useEffect(() => {
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

      // Block native browser pull-to-refresh / page reload gesture
      if (e.cancelable) {
        e.preventDefault();
      }

      const currentY = e.touches[0].clientY;
      const delta = currentY - dragStartY.current;
      currentDeltaY.current = delta;

      // Only allow pulling DOWN (delta > 0). Pulling UP (delta < 0) is clamped to 0
      // so the bottom of the place details modal NEVER lifts off the bottom of the screen!
      const clampedDelta = Math.max(0, delta);
      sheetRef.current.style.transform = `translateY(${clampedDelta}px)`;
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current || !sheetRef.current) return;
      isDraggingRef.current = false;
      const delta = currentDeltaY.current;

      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

      if (delta > 110) {
        // Dragged down past threshold -> Close sheet
        sheetRef.current.style.transform = 'translateY(100%)';
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        // Snap back to grounded bottom-0 position
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
  }, [place?.id, onClose]);

  // Always compute distance for the currently displayed place using haversine * 1.25 street factor.
  // This ensures the time in the place card always matches the route banner estimate.
  const activeDistance = useMemo(() => {
    if (!place) return null;
    const isUser = selectedOrigin === 'user' && userLocation !== null;
    const baseLat = isUser ? userLocation!.lat : UNIVERSITY.lat;
    const baseLng = isUser ? userLocation!.lng : UNIVERSITY.lng;
    return haversineDistance(baseLat, baseLng, place.lat, place.lng) * 1.25;
  }, [place, selectedOrigin, userLocation]);

  useEffect(() => {
    if (!place) return;
    setFav(isFavorite(place.id));
    setLoadingReviews(true);
    fetchReviews(place.id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [place]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  if (!place) return null;

  const cat = place.category;
  const Icon = getCategoryIcon(cat?.icon ?? 'MapPin');

  const handleFavorite = () => {
    const newState = toggleFavorite(place.id);
    setFav(newState);
  };

  const handleSubmitReview = async () => {
    if (!newReview.author.trim() || !place) return;
    setSubmitting(true);
    try {
      const review = await addReview({
        place_id: place.id,
        author: newReview.author.trim(),
        rating: newReview.rating,
        comment: newReview.comment.trim() || null,
      });
      setReviews([review, ...reviews]);
      setNewReview({ author: '', rating: 5, comment: '' });
      setShowReviewForm(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

  const FALLBACK_CATEGORY_PHOTOS: Record<string, string> = {
    alimentacao: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
    bibliotecas: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    'salas-predios': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    convivencia: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    academias: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    esportes: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    mercados: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    'saude-farmacias': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    moradias: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    servicos: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    transporte: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    'igrejas-templos': 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=800&q=80',
  };

  function getFallbackPhoto(slug?: string): string {
    return FALLBACK_CATEGORY_PHOTOS[slug ?? ''] ?? 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';
  }

  return (
    <div
      ref={sheetRef}
      className="pointer-events-auto z-[1000] flex flex-col bg-white shadow-2xl fixed inset-x-0 bottom-0 rounded-t-3xl h-[72dvh] md:fixed md:right-0 md:top-0 md:bottom-0 md:inset-x-auto md:h-full md:w-96 md:max-w-none md:rounded-none md:translate-y-0"
      style={{ willChange: 'transform, height', overscrollBehaviorY: 'contain' }}
    >
      {/* Mobile Touch Drag Handle Bar */}
      <div
        ref={dragHandleRef}
        className="flex w-full cursor-grab active:cursor-grabbing items-center justify-center py-2.5 md:hidden touch-none flex-shrink-0 bg-white rounded-t-3xl z-10"
      >
        <div className="h-1.5 w-12 rounded-full bg-gray-300" />
      </div>

      {/* Single Scrollable Area containing Header Image + Content */}
      <div className="flex-1 overflow-y-auto" style={{ overscrollBehaviorY: 'contain' }}>
        {/* Header image - now scrolls together with content */}
        <div
          ref={headerRef}
          className="relative h-44 w-full flex-shrink-0 overflow-hidden bg-gray-200"
        >
          {place.photos[0] ? (
            <img
              src={place.photos[0]}
              alt={place.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getFallbackPhoto(cat?.slug);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100">
              <Icon className="h-12 w-12 text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={handleAnimatedClose}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-gray-700 shadow-md transition hover:bg-white z-10"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: cat?.color }}
              >
                <Icon className="h-3 w-3" />
                {cat?.name}
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-bold text-white drop-shadow">{place.name}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Rating + Favorite */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {avgRating > 0 ? (
                <>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${n <= Math.round(avgRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400">Sem avaliações ainda</span>
              )}
            </div>
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${fav
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
              <Heart className={`h-3.5 w-3.5 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
              {fav ? 'Favoritado' : 'Favoritar'}
            </button>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-sm text-gray-600">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <span>{place.address}</span>
            </div>
            {place.hours && (
              <div className="flex items-start gap-2.5 text-sm text-gray-600">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>{place.hours}</span>
              </div>
            )}
            {place.contact && (
              <div className="flex items-start gap-2.5 text-sm text-gray-600">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>{place.contact}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {place.description && (
            <div className="mt-4">
              <h3 className="mb-1.5 text-sm font-semibold text-gray-700">Descrição</h3>
              <p className="text-sm leading-relaxed text-gray-500">{place.description}</p>
            </div>
          )}

          {/* Distance info & transport mode preview */}
          {activeDistance != null && (
            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-2.5">
              {userLocation && (
                <div className="flex gap-1 rounded-xl bg-gray-200/60 p-1 mb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedOrigin('university')}
                    className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${selectedOrigin === 'university'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    🏛️ Da UFC
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrigin('user')}
                    className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${selectedOrigin === 'user'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    📍 De você
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Route className="h-4 w-4 text-blue-600" />
                  {selectedOrigin === 'user' && userLocation ? 'Distância de você:' : 'Distância da UFC:'}
                </span>
                <span className="font-bold text-gray-800">{formatDistance(activeDistance)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProfile('foot')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 text-xs font-semibold transition border ${selectedProfile === 'foot'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <Footprints className="h-3.5 w-3.5" />
                  A pé ({formatDuration(estimateWalkingTime(activeDistance))})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProfile('driving')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 text-xs font-semibold transition border ${selectedProfile === 'driving'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <Car className="h-3.5 w-3.5" />
                  Automóvel ({formatDuration(estimateDrivingTime(activeDistance))})
                </button>
              </div>
            </div>
          )}

          {/* Photos */}
          {place.photos.length > 1 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Fotos</h3>
              <div className="grid grid-cols-3 gap-2">
                {place.photos.slice(1).map((photo, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={photo}
                      alt={`${place.name} ${i + 2}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackPhoto(cat?.slug);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Avaliações dos estudantes
              </h3>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {showReviewForm ? 'Cancelar' : 'Avaliar'}
              </button>
            </div>

            {showReviewForm && (
              <div className="mb-4 space-y-3 rounded-xl border border-gray-100 p-4 animate-fade-in">
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={newReview.author}
                  onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNewReview({ ...newReview, rating: n })}
                    >
                      <Star
                        className={`h-6 w-6 transition ${n <= newReview.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 hover:text-amber-300'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Conte sua experiência..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={!newReview.author.trim() || submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar avaliação
                </button>
              </div>
            )}

            {loadingReviews ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma avaliação ainda. Seja o primeiro!</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{review.author}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${n <= review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-200'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-1.5 text-sm text-gray-500">{review.comment}</p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Route buttons & Transport profile selector */}
        <div className="flex-shrink-0 border-t border-gray-100 p-4 bg-white">
          {hasActiveRoute ? (
            <button
              onClick={onClearRoute}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
              Limpar rota
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onRoute('university', selectedProfile);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                >
                  <Navigation className="h-4 w-4" />
                  Da universidade
                </button>
                <button
                  onClick={() => {
                    onRoute('user', selectedProfile);
                    onClose();
                  }}
                  disabled={!userLocation}
                  className="flex flex-col items-center gap-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                >
                  <Navigation className="h-4 w-4" />
                  {userLocation ? 'De onde estou' : 'Sem GPS'}
                </button>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir no Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
