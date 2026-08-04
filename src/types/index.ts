export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Place {
  id: string;
  name: string;
  description: string | null;
  address: string;
  lat: number;
  lng: number;
  category_id: string;
  hours: string | null;
  contact: string | null;
  photos: string[];
  created_at: string;
  category?: Category;
  reviews?: Review[];
}

export interface Review {
  id: string;
  place_id: string;
  author: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PlaceWithMeta extends Place {
  category?: Category;
  avgRating?: number;
  reviewCount?: number;
  distance?: number;
  duration?: number;
}
