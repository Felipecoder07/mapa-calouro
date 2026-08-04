/*
# Create categories, places, and reviews tables for the Freshman Interactive Map

1. New Tables
- `categories`
  - `id` (uuid, primary key)
  - `name` (text, not null, unique) — category name (Academias, Restaurantes, etc.)
  - `slug` (text, not null, unique) — URL-friendly identifier
  - `icon` (text, not null) — lucide-react icon name for the category
  - `color` (text, not null) — hex color for map markers
  - `sort_order` (int, default 0) — display order
  - `created_at` (timestamptz)
- `places`
  - `id` (uuid, primary key)
  - `name` (text, not null) — establishment name
  - `description` (text) — description / recommendation
  - `address` (text, not null) — street address
  - `lat` (numeric, not null) — latitude
  - `lng` (numeric, not null) — longitude
  - `category_id` (uuid FK → categories) — category
  - `hours` (text) — operating hours (free text)
  - `contact` (text) — phone / social media
  - `photos` (text[]) — array of photo URLs
  - `created_at` (timestamptz)
- `reviews`
  - `id` (uuid, primary key)
  - `place_id` (uuid FK → places ON DELETE CASCADE)
  - `author` (text, not null) — student name (no auth in MVP)
  - `rating` (int, not null, CHECK 1-5)
  - `comment` (text) — review text
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all three tables.
- This is a no-auth (single-tenant) app: the frontend uses the anon key.
- All policies use `TO anon, authenticated` so the anon-key client can read and write.
- SELECT is open to all (public data).
- INSERT on reviews is open (students post reviews without login).
- INSERT/UPDATE/DELETE on places and categories are also open in the MVP so the
  admin panel (protected client-side) can manage them. In production, lock these
  down to an authenticated admin role.

3. Indexes
- `places` on `category_id` for filter queries.
- `reviews` on `place_id` for fetching reviews per place.
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL,
  color text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- Places
CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  hours text,
  contact text,
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_places" ON places;
CREATE POLICY "anon_read_places" ON places FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_places" ON places;
CREATE POLICY "anon_insert_places" ON places FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_places" ON places;
CREATE POLICY "anon_update_places" ON places FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_places" ON places;
CREATE POLICY "anon_delete_places" ON places FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_places_category_id ON places(category_id);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_reviews" ON reviews;
CREATE POLICY "anon_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON reviews;
CREATE POLICY "anon_insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reviews" ON reviews;
CREATE POLICY "anon_update_reviews" ON reviews FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reviews" ON reviews;
CREATE POLICY "anon_delete_reviews" ON reviews FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);