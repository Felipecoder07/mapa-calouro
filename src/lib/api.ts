import { supabase, isSupabaseConfigured } from './supabase';
import type { Category, Place, Review } from '@/types';
import {
  getLocalCategories,
  saveLocalCategory,
  deleteLocalCategory,
  getLocalPlaces,
  getLocalReviews,
  addLocalReview,
  deleteLocalReview,
  saveLocalPlace,
  updateLocalPlace,
  deleteLocalPlace,
  clearAllLocalData,
} from './mockData';

// Ordem de Prioridade dos Dados:
// 1. Supabase (nuvem, se configurado)
// 2. Servidor API SQLite (/api/...)
// 3. Armazenamento local do navegador (localStorage)

const ADMIN_TOKEN_KEY = 'mapa_calouros_admin_token';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export async function loginAdmin(password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        return true;
      }
    }
  } catch (e) {
    console.warn('Falha no login admin via API:', e);
  }

  // Validação em ambiente local/desenvolvimento via variável de ambiente
  const expectedPass = import.meta.env.VITE_ADMIN_PASSWORD || import.meta.env.ADMIN_PASSWORD || 'admin123';
  if (password === expectedPass) {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, 'mock-admin-token');
    return true;
  }

  return false;
}

export async function fetchCategories(): Promise<Category[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('FALHA SUPABASE: tentando SQLite API', e);
    }
  }

  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('FALHA SQLITE API: usando localStorage', e);
  }

  return getLocalCategories();
}

export async function createCategory(category: Omit<Category, 'id' | 'sort_order'>): Promise<Category> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('FALHA SUPABASE: criando via SQLite API', e);
    }
  }

  try {
    const token = getAdminToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify(category),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('FALHA SQLITE API: salvando em localStorage', e);
  }

  return saveLocalCategory(category);
}

export async function deleteCategory(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) return;
    } catch (e) {
      console.warn('FALHA SUPABASE: excluindo via SQLite API', e);
    }
  }

  try {
    const token = getAdminToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) return;
  } catch (e) {
    console.warn('FALHA SQLITE API: excluindo de localStorage', e);
  }

  return deleteLocalCategory(id);
}

export async function fetchPlaces(): Promise<Place[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*, category:categories(*)')
        .order('name');
      if (!error && data) {
        clearAllLocalData();
        return data;
      }
    } catch (e) {
      console.warn('FALHA SUPABASE: tentando SQLite API', e);
    }
  }

  try {
    const res = await fetch('/api/places');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        clearAllLocalData();
        return data;
      }
    }
  } catch (e) {
    console.warn('FALHA SQLITE API: usando localStorage', e);
  }

  return getLocalPlaces();
}

export async function createPlace(place: Omit<Place, 'id' | 'created_at' | 'category'>): Promise<Place> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('places')
        .insert(place)
        .select('*, category:categories(*)')
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('FALHA SUPABASE: criando via SQLite API', e);
    }
  }

  try {
    const token = getAdminToken() || 'mock-admin-token';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/places', {
      method: 'POST',
      headers,
      body: JSON.stringify(place),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('FALHA SQLITE API: criando em localStorage', e);
  }

  return saveLocalPlace(place);
}

export async function updatePlace(
  id: string,
  place: Partial<Omit<Place, 'id' | 'created_at' | 'category'>>
): Promise<Place> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('places')
        .update(place)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('FALHA SUPABASE: atualizando via SQLite API', e);
    }
  }

  try {
    const token = getAdminToken() || 'mock-admin-token';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/places/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(place),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('FALHA SQLITE API: atualizando em localStorage', e);
  }

  return updateLocalPlace(id, place);
}

export async function deletePlace(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (!error) return;
    } catch (e) {
      console.warn('FALHA SUPABASE: excluindo via SQLite API', e);
    }
  }

  try {
    const token = getAdminToken() || 'mock-admin-token';
    const headers: Record<string, string> = {};
    headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/places/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) return;
  } catch (e) {
    console.warn('FALHA SQLITE API: excluindo de localStorage', e);
  }

  return deleteLocalPlace(id);
}

export async function fetchReviews(placeId: string): Promise<Review[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('FALHA SUPABASE: buscando avaliações via SQLite API', e);
    }
  }

  try {
    const res = await fetch(`/api/reviews?place_id=${encodeURIComponent(placeId)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('FALHA SQLITE API: usando localStorage', e);
  }

  return getLocalReviews(placeId);
}

export async function fetchReviewsForPlaces(placeIds: string[]): Promise<Map<string, Review[]>> {
  if (placeIds.length === 0) return new Map();

  let reviews: Review[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .in('place_id', placeIds)
        .order('created_at', { ascending: false });
      if (!error && data) reviews = data;
    } catch (e) {
      console.warn('FALHA SUPABASE: buscando avaliações via SQLite API', e);
    }
  }

  if (reviews.length === 0) {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) reviews = data;
      }
    } catch (e) {
      console.warn('FALHA SQLITE API: buscando avaliações em localStorage', e);
    }
  }

  if (reviews.length === 0) {
    reviews = getLocalReviews();
  }

  const map = new Map<string, Review[]>();
  for (const review of reviews) {
    if (placeIds.includes(review.place_id)) {
      const list = map.get(review.place_id) ?? [];
      list.push(review);
      map.set(review.place_id, list);
    }
  }
  return map;
}

export async function addReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('FALHA SUPABASE: salvando avaliação via SQLite API', e);
    }
  }

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('FALHA SQLITE API: salvando avaliação em localStorage', e);
  }

  return addLocalReview(review);
}

export async function deleteReview(id: string): Promise<boolean> {
  deleteLocalReview(id);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('reviews').delete().eq('id', id);
    } catch (e) {
      console.warn('FALHA SUPABASE: deletando avaliação via SQLite API', e);
    }
  }

  try {
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('FALHA SQLITE API: deletando avaliação em localStorage', e);
  }

  return true;
}
