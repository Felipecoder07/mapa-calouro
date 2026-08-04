import { FAVORITES_KEY } from './constants';

export function getFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isFavorite(placeId: string): boolean {
  return getFavorites().includes(placeId);
}

export function toggleFavorite(placeId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(placeId);
  if (index >= 0) {
    favorites.splice(index, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return false;
  }
  favorites.push(placeId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return true;
}
