import { supabase, isSupabaseConfigured } from './supabase';
import type { Category, Place, Review } from '@/types';
import {
  getLocalCategories,
  saveLocalCategory,
  deleteLocalCategory,
  getLocalPlaces,
  getLocalReviews,
  addLocalReview,
  saveLocalPlace,
  updateLocalPlace,
  deleteLocalPlace,
  clearAllLocalData,
} from './mockData';

// Priority 1: Supabase (if configured)
// Priority 2: SQLite API Server (/api/...)
// Priority 3: Browser localStorage (mockData)

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
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
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
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/places/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/places/${id}`, { method: 'DELETE' });
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
