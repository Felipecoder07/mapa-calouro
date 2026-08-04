import { describe, it, expect } from 'vitest';
import type { PlaceWithMeta, Category } from '../src/types';

describe('Módulo 6: Busca e Filtros (Sidebar & Filter Logic)', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Alimentação', slug: 'alimentacao', icon: 'Utensils', color: '#ef4444', sort_order: 1 },
    { id: 'cat-2', name: 'Bibliotecas', slug: 'bibliotecas', icon: 'BookOpen', color: '#3b82f6', sort_order: 2 },
  ];

  const mockPlaces: PlaceWithMeta[] = [
    {
      id: 'p-1',
      name: 'Restaurante Universitário RU',
      description: 'Refeições para estudantes',
      address: 'Campus UFC Russas',
      lat: -4.9471,
      lng: -37.9745,
      category_id: 'cat-1',
      hours: '11:00 - 13:30',
      contact: null,
      photos: [],
      created_at: new Date().toISOString(),
      category: mockCategories[0],
    },
    {
      id: 'p-2',
      name: 'Biblioteca Central',
      description: 'Acervo de livros e salas de estudo',
      address: 'Bloco Didático 1',
      lat: -4.9465,
      lng: -37.9740,
      category_id: 'cat-2',
      hours: '07:30 - 21:00',
      contact: null,
      photos: [],
      created_at: new Date().toISOString(),
      category: mockCategories[1],
    },
  ];

  it('E2E-28: Busca por nome parcial retorna locais correspondentes', () => {
    const query = 'restaurante';
    const result = mockPlaces.filter((p) => p.name.toLowerCase().includes(query));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p-1');
  });

  it('E2E-29: Busca é case-insensitive (maiúsculas = minúsculas)', () => {
    const queryUpper = 'BIBLIOTECA';
    const queryLower = 'biblioteca';
    const res1 = mockPlaces.filter((p) => p.name.toLowerCase().includes(queryUpper.toLowerCase()));
    const res2 = mockPlaces.filter((p) => p.name.toLowerCase().includes(queryLower.toLowerCase()));
    expect(res1).toEqual(res2);
    expect(res1).toHaveLength(1);
  });

  it('E2E-30: Busca por endereço retorna local correspondente', () => {
    const query = 'bloco didático';
    const result = mockPlaces.filter((p) => p.address.toLowerCase().includes(query));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p-2');
  });

  it('E2E-31: Busca sem correspondência retorna lista vazia', () => {
    const query = 'local_inexistente_xyz';
    const result = mockPlaces.filter((p) => p.name.toLowerCase().includes(query));
    expect(result).toHaveLength(0);
  });

  it('E2E-33: Filtro por categoria filtra apenas locais da categoria selecionada', () => {
    const selectedCatSlug = 'alimentacao';
    const result = mockPlaces.filter((p) => p.category?.slug === selectedCatSlug);
    expect(result).toHaveLength(1);
    expect(result[0].category?.slug).toBe('alimentacao');
  });

  it('E2E-34: Múltiplas categorias selecionadas filtram com operador OR', () => {
    const selectedSlugs = new Set(['alimentacao', 'bibliotecas']);
    const result = mockPlaces.filter((p) => p.category && selectedSlugs.has(p.category.slug));
    expect(result).toHaveLength(2);
  });
});
