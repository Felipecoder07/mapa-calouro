import type { Category, Place, Review } from '@/types';

export const INITIAL_MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Alimentação',
    slug: 'alimentacao',
    icon: 'Utensils',
    color: '#ef4444',
    sort_order: 1,
  },
  {
    id: 'cat-2',
    name: 'Bibliotecas',
    slug: 'bibliotecas',
    icon: 'BookOpen',
    color: '#3b82f6',
    sort_order: 2,
  },
  {
    id: 'cat-3',
    name: 'Salas & Prédios',
    slug: 'salas-predios',
    icon: 'Building2',
    color: '#8b5cf6',
    sort_order: 3,
  },
  {
    id: 'cat-4',
    name: 'Convivência',
    slug: 'convivencia',
    icon: 'Coffee',
    color: '#f59e0b',
    sort_order: 4,
  },
  {
    id: 'cat-5',
    name: 'Academias & Fitness',
    slug: 'academias',
    icon: 'Dumbbell',
    color: '#ec4899',
    sort_order: 5,
  },
  {
    id: 'cat-6',
    name: 'Esportes & Lazer',
    slug: 'esportes',
    icon: 'Trophy',
    color: '#10b981',
    sort_order: 6,
  },
  {
    id: 'cat-7',
    name: 'Mercados & Lojas',
    slug: 'mercados',
    icon: 'ShoppingCart',
    color: '#06b6d4',
    sort_order: 7,
  },
  {
    id: 'cat-8',
    name: 'Saúde & Farmácias',
    slug: 'saude-farmacias',
    icon: 'Pill',
    color: '#14b8a6',
    sort_order: 8,
  },
  {
    id: 'cat-9',
    name: 'Moradias & Repúblicas',
    slug: 'moradias',
    icon: 'Home',
    color: '#f97316',
    sort_order: 9,
  },
  {
    id: 'cat-10',
    name: 'Serviços & Impressão',
    slug: 'servicos',
    icon: 'Printer',
    color: '#6b7280',
    sort_order: 10,
  },
  {
    id: 'cat-11',
    name: 'Transporte & Rodoviária',
    slug: 'transporte',
    icon: 'Bus',
    color: '#6366f1',
    sort_order: 11,
  },
  {
    id: 'cat-12',
    name: 'Igrejas & Templos',
    slug: 'igrejas-templos',
    icon: 'Church',
    color: '#a855f7',
    sort_order: 12,
  },
];

export const INITIAL_MOCK_PLACES: Place[] = [];
export const INITIAL_MOCK_REVIEWS: Review[] = [];

const STORAGE_KEYS = {
  CATEGORIES: 'mapa_calouros_mock_categories',
  PLACES: 'mapa_calouros_mock_places',
  REVIEWS: 'mapa_calouros_mock_reviews',
};

export const clearAllLocalData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PLACES);
  localStorage.removeItem(STORAGE_KEYS.REVIEWS);
};

export const getLocalCategories = (): Category[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_MOCK_CATEGORIES));
    return INITIAL_MOCK_CATEGORIES;
  }

  const storedCats: Category[] = JSON.parse(stored);
  // Ensure default categories exist
  INITIAL_MOCK_CATEGORIES.forEach((initCat) => {
    if (!storedCats.some((c) => c.slug === initCat.slug || c.id === initCat.id)) {
      storedCats.push(initCat);
    }
  });

  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(storedCats));
  return storedCats;
};

export const saveLocalCategory = (cat: Omit<Category, 'id' | 'sort_order'>): Category => {
  const categories = getLocalCategories();
  const newCat: Category = {
    ...cat,
    id: `cat-${Date.now()}`,
    sort_order: categories.length + 1,
  };
  categories.push(newCat);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return newCat;
};

export const deleteLocalCategory = (id: string): void => {
  const categories = getLocalCategories().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
};

export const getLocalPlaces = (): Place[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.PLACES);
  const categories = getLocalCategories();

  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify([]));
    return [];
  }

  const places: Place[] = JSON.parse(stored);
  const defaultCategory = categories[0] || INITIAL_MOCK_CATEGORIES[0];

  return places.map((p) => {
    const matchedCategory = categories.find((c) => c.id === p.category_id || c.slug === p.category_id) || defaultCategory;
    return {
      ...p,
      category_id: matchedCategory.id,
      category: matchedCategory,
    };
  });
};

export const getLocalReviews = (placeId?: string): Review[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  let reviews: Review[] = [];

  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
    return [];
  } else {
    reviews = JSON.parse(stored);
  }

  if (placeId) {
    return reviews.filter((r) => r.place_id === placeId);
  }
  return reviews;
};

export const addLocalReview = (review: Omit<Review, 'id' | 'created_at'>): Review => {
  const reviews = getLocalReviews();
  const newReview: Review = {
    ...review,
    id: `rev-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  reviews.unshift(newReview);
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  return newReview;
};

export const saveLocalPlace = (place: Omit<Place, 'id' | 'created_at' | 'category'>): Place => {
  const places = getLocalPlaces();
  const categories = getLocalCategories();
  const newPlace: Place = {
    ...place,
    id: `place-${Date.now()}`,
    created_at: new Date().toISOString(),
    category: categories.find((c) => c.id === place.category_id),
  };
  places.unshift(newPlace);
  localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
  return newPlace;
};

export const updateLocalPlace = (id: string, updates: Partial<Omit<Place, 'id' | 'created_at' | 'category'>>): Place => {
  const places = getLocalPlaces();
  const categories = getLocalCategories();
  const index = places.findIndex((p) => p.id === id);

  const matchedCat = categories.find((c) => c.id === updates.category_id) || categories[0];

  if (index === -1) {
    const newPlace: Place = {
      id,
      name: updates.name || 'Local',
      description: updates.description || null,
      address: updates.address || '',
      lat: updates.lat || -4.947,
      lng: updates.lng || -37.974,
      category_id: updates.category_id || matchedCat?.id || 'cat-1',
      category: matchedCat,
      hours: updates.hours || null,
      contact: updates.contact || null,
      photos: updates.photos || [],
      created_at: new Date().toISOString(),
    };
    places.unshift(newPlace);
    localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
    return newPlace;
  }

  const updated: Place = {
    ...places[index],
    ...updates,
    category: categories.find((c) => c.id === (updates.category_id || places[index].category_id)),
  };
  places[index] = updated;
  localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
  return updated;
};

export const deleteLocalPlace = (id: string): void => {
  const places = getLocalPlaces().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
  const reviews = getLocalReviews().filter((r) => r.place_id !== id);
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
};

export const deleteLocalReview = (id: string): void => {
  const reviews = getLocalReviews().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
};
