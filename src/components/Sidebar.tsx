import { useState, useMemo } from 'react';
import { Search, Star, MapPin, X, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { getCategoryIcon, getCategoryEmoji } from '@/lib/icons';
import { formatDistance } from '@/lib/distance';
import { isFavorite } from '@/lib/favorites';
import type { PlaceWithMeta, Category } from '@/types';

interface SidebarProps {
  places: PlaceWithMeta[];
  categories: Category[];
  selectedCategories: Set<string>;
  onToggleCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlace: PlaceWithMeta | null;
  onSelectPlace: (place: PlaceWithMeta) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesFilter: () => void;
}

export default function Sidebar({
  places,
  categories,
  selectedCategories,
  onToggleCategory,
  searchQuery,
  onSearchChange,
  selectedPlace,
  onSelectPlace,
  showFavoritesOnly,
  onToggleFavoritesFilter,
}: SidebarProps) {
  const [showFiltersGrid, setShowFiltersGrid] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    places.forEach((p) => {
      if (p.category) {
        counts.set(p.category.slug, (counts.get(p.category.slug) || 0) + 1);
      }
    });
    return counts;
  }, [places]);

  const filteredPlaces = useMemo(() => {
    let result = places;

    if (selectedCategories.size > 0) {
      result = result.filter((p) => {
        const cat = p.category;
        return cat && selectedCategories.has(cat.slug);
      });
    }

    if (showFavoritesOnly) {
      result = result.filter((p) => isFavorite(p.id));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [places, selectedCategories, searchQuery, showFavoritesOnly]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Search & Category Filter Section */}
      <div className="border-b border-gray-100 p-4 pb-3 flex-shrink-0 bg-white">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar local, restaurante, sala..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-9 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Category Chips Bar */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          <button
            onClick={onToggleFavoritesFilter}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition shadow-xs ${
              showFavoritesOnly
                ? 'border-amber-300 bg-amber-500 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${showFavoritesOnly ? 'fill-white text-white' : 'text-amber-400'}`} />
            <span>Favoritos</span>
          </button>

          <button
            onClick={() => setShowFiltersGrid(!showFiltersGrid)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition shadow-xs ${
              showFiltersGrid || selectedCategories.size > 0
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {selectedCategories.size > 0 && (
              <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {selectedCategories.size}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-gray-200 flex-shrink-0 mx-0.5" />

          {categories.map((cat) => {
            const isActive = selectedCategories.has(cat.slug);
            const count = categoryCounts.get(cat.slug) || 0;
            return (
              <button
                key={cat.id}
                onClick={() => onToggleCategory(cat.slug)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition shadow-xs ${
                  isActive
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                style={isActive ? { backgroundColor: cat.color } : undefined}
              >
                <span>{getCategoryEmoji(cat)}</span>
                <span>{cat.name}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Clean Category Expandable Grid Filter */}
        {showFiltersGrid && (
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 border-t border-gray-100 pt-2.5 animate-fade-in custom-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategories.has(cat.slug);
              const count = categoryCounts.get(cat.slug) || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => onToggleCategory(cat.slug)}
                  className={`flex items-center justify-between gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  style={isActive ? { backgroundColor: cat.color } : undefined}
                >
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="text-xs">{getCategoryEmoji(cat)}</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Place list */}
      <div className="flex-1 overflow-y-auto p-3.5 bg-gray-50/60">
        {filteredPlaces.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <MapPin className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              Nenhum local encontrado.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Tente selecionar outra categoria ou buscar por outro termo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlaces.map((place) => {
              const cat = place.category;
              const Icon = getCategoryIcon(cat?.icon ?? 'MapPin');
              const isSelected = selectedPlace?.id === place.id;
              const fav = isFavorite(place.id);
              const photo = place.photos[0];

              return (
                <button
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl border p-3 text-left transition shadow-xs ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/90 ring-2 ring-blue-100 shadow-md'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* Photo Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-xs border border-gray-100">
                    {photo ? (
                      <img
                        src={photo}
                        alt={place.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-2xl"
                        style={{ backgroundColor: `${cat?.color}15` }}
                      >
                        {getCategoryEmoji(cat)}
                      </div>
                    )}
                    {fav && (
                      <div className="absolute right-1 top-1 rounded-full bg-white/95 p-1 shadow-xs">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </div>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between h-20 py-0.5">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="truncate text-sm font-bold text-gray-900">
                          {place.name}
                        </h3>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: cat?.color }}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {cat?.name}
                        </span>

                        {place.avgRating != null && place.avgRating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-600">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {place.avgRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-auto">
                      {place.distance != null ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-blue-600">
                          <MapPin className="h-3 w-3" />
                          {formatDistance(place.distance)}
                        </span>
                      ) : <div />}

                      <span className="flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 transition hover:bg-blue-100">
                        Ver no mapa
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="border-t border-gray-100 bg-white px-4 py-2.5 text-center text-xs font-semibold text-gray-400">
        {filteredPlaces.length} {filteredPlaces.length === 1 ? 'local encontrado' : 'locais encontrados'}
      </div>
    </div>
  );
}
