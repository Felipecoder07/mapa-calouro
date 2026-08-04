import { useState, useMemo } from 'react';
import { Search, Star, MapPin, X, SlidersHorizontal } from 'lucide-react';
import { getCategoryIcon } from '@/lib/icons';
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
  const [showFilters, setShowFilters] = useState(false);

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
      {/* Search bar */}
      <div className="border-b border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar estabelecimento ou local..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              showFilters || selectedCategories.size > 0
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Categorias ({categories.length})
            {selectedCategories.size > 0 && (
              <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {selectedCategories.size}
              </span>
            )}
          </button>
          <button
            onClick={onToggleFavoritesFilter}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              showFavoritesOnly
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            Favoritos
          </button>
          {(selectedCategories.size > 0 || showFavoritesOnly) && (
            <button
              onClick={() => {
                selectedCategories.forEach((slug) => onToggleCategory(slug));
                if (showFavoritesOnly) onToggleFavoritesFilter();
              }}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>

        {/* Clean Category Grid Filter */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-1 border-t border-gray-100 pt-3 animate-fade-in custom-scrollbar">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
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
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: isActive ? '#ffffff' : cat.color }} />
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
      <div className="flex-1 overflow-y-auto">
        {filteredPlaces.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <MapPin className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              Nenhum local encontrado.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Tente selecionar outra categoria ou usar o painel Admin para adicionar locais.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredPlaces.map((place) => {
              const cat = place.category;
              const Icon = getCategoryIcon(cat?.icon ?? 'MapPin');
              const isSelected = selectedPlace?.id === place.id;
              const fav = isFavorite(place.id);

              return (
                <button
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  className={`flex w-full items-start gap-3 p-4 text-left transition ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm"
                    style={{ backgroundColor: `${cat?.color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: cat?.color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-bold text-gray-800">
                        {place.name}
                      </h3>
                      {fav && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{cat?.name}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      {place.distance != null && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                          <MapPin className="h-3 w-3" />
                          {formatDistance(place.distance)}
                        </span>
                      )}
                      {place.avgRating != null && place.avgRating > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {place.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Count footer */}
      <div className="border-t border-gray-100 px-4 py-2.5 text-center text-xs font-medium text-gray-400">
        {filteredPlaces.length} {filteredPlaces.length === 1 ? 'local exibido' : 'locais exibidos'}
      </div>
    </div>
  );
}
