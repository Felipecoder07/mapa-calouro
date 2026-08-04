import { describe, it, expect, beforeEach } from 'vitest';
import { getFavorites, isFavorite, toggleFavorite } from '../src/lib/favorites';
import { FAVORITES_KEY } from '../src/lib/constants';

describe('Módulo 3: Favoritos (favorites.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('UT-21: toggleFavorite - adiciona novo ID de local aos favoritos', () => {
    const isFav = toggleFavorite('place-123');
    expect(isFav).toBe(true);
    expect(getFavorites()).toContain('place-123');
  });

  it('UT-22: toggleFavorite - remove ID já existente dos favoritos', () => {
    toggleFavorite('place-123');
    const isFav = toggleFavorite('place-123');
    expect(isFav).toBe(false);
    expect(getFavorites()).not.toContain('place-123');
  });

  it('UT-23: toggleFavorite - gerencia múltiplos favoritos sem duplicação', () => {
    toggleFavorite('place-1');
    toggleFavorite('place-2');
    expect(getFavorites()).toEqual(['place-1', 'place-2']);
  });

  it('UT-24: isFavorite - retorna false para ID que não foi favoritado', () => {
    expect(isFavorite('place-inexistente')).toBe(false);
  });

  it('UT-25: getFavorites - retorna array vazio se localStorage estiver limpo', () => {
    expect(getFavorites()).toEqual([]);
  });

  it('UT-26: getFavorites - lida suavemente com JSON inválido sem quebrar', () => {
    localStorage.setItem(FAVORITES_KEY, '{json_invalido}');
    expect(getFavorites()).toEqual([]);
  });
});
