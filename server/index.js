import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'database.sqlite'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    category_id TEXT NOT NULL,
    hours TEXT,
    contact TEXT,
    photos TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL
  );
`);

// Initial categories seed if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM categories');
const { count } = countStmt.get();

if (count === 0) {
  const initialCategories = [
    { id: 'cat-1', name: 'Alimentação', slug: 'alimentacao', icon: 'Utensils', color: '#ef4444', sort_order: 1 },
    { id: 'cat-2', name: 'Bibliotecas', slug: 'bibliotecas', icon: 'BookOpen', color: '#3b82f6', sort_order: 2 },
    { id: 'cat-3', name: 'Salas & Prédios', slug: 'salas-predios', icon: 'Building2', color: '#8b5cf6', sort_order: 3 },
    { id: 'cat-4', name: 'Convivência', slug: 'convivencia', icon: 'Coffee', color: '#f59e0b', sort_order: 4 },
    { id: 'cat-5', name: 'Academias & Fitness', slug: 'academias', icon: 'Dumbbell', color: '#ec4899', sort_order: 5 },
    { id: 'cat-6', name: 'Esportes & Lazer', slug: 'esportes', icon: 'Trophy', color: '#10b981', sort_order: 6 },
    { id: 'cat-7', name: 'Mercados & Lojas', slug: 'mercados', icon: 'ShoppingCart', color: '#06b6d4', sort_order: 7 },
    { id: 'cat-8', name: 'Saúde & Farmácias', slug: 'saude-farmacias', icon: 'Pill', color: '#14b8a6', sort_order: 8 },
    { id: 'cat-9', name: 'Moradias & Repúblicas', slug: 'moradias', icon: 'Home', color: '#f97316', sort_order: 9 },
    { id: 'cat-10', name: 'Serviços & Impressão', slug: 'servicos', icon: 'Printer', color: '#6b7280', sort_order: 10 },
    { id: 'cat-11', name: 'Transporte & Rodoviária', slug: 'transporte', icon: 'Bus', color: '#6366f1', sort_order: 11 },
    { id: 'cat-12', name: 'Igrejas & Templos', slug: 'igrejas-templos', icon: 'Church', color: '#a855f7', sort_order: 12 },
  ];

  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, icon, color, sort_order)
    VALUES (@id, @name, @slug, @icon, @color, @sort_order)
  `);

  const insertMany = db.transaction((cats) => {
    for (const c of cats) insertCat.run(c);
  });
  insertMany(initialCategories);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CATEGORIES ENDPOINTS
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name, slug, icon, color } = req.body;
    const categories = db.prepare('SELECT * FROM categories').all();
    const newCategory = {
      id: `cat-${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      icon: icon || 'Building2',
      color: color || '#3b82f6',
      sort_order: categories.length + 1,
    };
    db.prepare(`
      INSERT INTO categories (id, name, slug, icon, color, sort_order)
      VALUES (@id, @name, @slug, @icon, @color, @sort_order)
    `).run(newCategory);
    res.status(201).json(newCategory);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PLACES ENDPOINTS
app.get('/api/places', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories').all();
    const categoriesMap = new Map(categories.map((c) => [c.id, c]));

    const rawPlaces = db.prepare('SELECT * FROM places ORDER BY created_at DESC').all();
    const places = rawPlaces.map((p) => {
      let photos = [];
      try {
        photos = JSON.parse(p.photos || '[]');
      } catch (err) {
        photos = [];
      }
      const category = categoriesMap.get(p.category_id) || categories[0];
      return {
        ...p,
        photos,
        category,
      };
    });
    res.json(places);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/places', (req, res) => {
  try {
    const { name, description, address, lat, lng, category_id, hours, contact, photos } = req.body;
    const categories = db.prepare('SELECT * FROM categories').all();
    const id = `place-${Date.now()}`;
    const created_at = new Date().toISOString();
    const photosJson = JSON.stringify(photos || []);

    const newPlaceRecord = {
      id,
      name,
      description: description || null,
      address,
      lat: Number(lat),
      lng: Number(lng),
      category_id,
      hours: hours || null,
      contact: contact || null,
      photos: photosJson,
      created_at,
    };

    db.prepare(`
      INSERT INTO places (id, name, description, address, lat, lng, category_id, hours, contact, photos, created_at)
      VALUES (@id, @name, @description, @address, @lat, @lng, @category_id, @hours, @contact, @photos, @created_at)
    `).run(newPlaceRecord);

    const category = categories.find((c) => c.id === category_id) || categories[0];
    res.status(201).json({
      ...newPlaceRecord,
      photos: photos || [],
      category,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/places/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM places WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Place not found' });

    const { name, description, address, lat, lng, category_id, hours, contact, photos } = req.body;

    const updatedRecord = {
      id,
      name: name ?? existing.name,
      description: description !== undefined ? description : existing.description,
      address: address ?? existing.address,
      lat: lat !== undefined ? Number(lat) : existing.lat,
      lng: lng !== undefined ? Number(lng) : existing.lng,
      category_id: category_id ?? existing.category_id,
      hours: hours !== undefined ? hours : existing.hours,
      contact: contact !== undefined ? contact : existing.contact,
      photos: photos !== undefined ? JSON.stringify(photos) : existing.photos,
      created_at: existing.created_at,
    };

    db.prepare(`
      UPDATE places
      SET name = @name, description = @description, address = @address, lat = @lat, lng = @lng,
          category_id = @category_id, hours = @hours, contact = @contact, photos = @photos
      WHERE id = @id
    `).run(updatedRecord);

    const categories = db.prepare('SELECT * FROM categories').all();
    const category = categories.find((c) => c.id === updatedRecord.category_id) || categories[0];

    res.json({
      ...updatedRecord,
      photos: photos !== undefined ? photos : JSON.parse(updatedRecord.photos || '[]'),
      category,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/places/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM places WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM reviews WHERE place_id = ?').run(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// REVIEWS ENDPOINTS
app.get('/api/reviews', (req, res) => {
  try {
    const { place_id } = req.query;
    let reviews;
    if (place_id) {
      reviews = db.prepare('SELECT * FROM reviews WHERE place_id = ? ORDER BY created_at DESC').all(place_id);
    } else {
      reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
    }
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/reviews', (req, res) => {
  try {
    const { place_id, author, rating, comment } = req.body;
    const newReview = {
      id: `rev-${Date.now()}`,
      place_id,
      author: author || 'Anônimo',
      rating: Number(rating),
      comment: comment || null,
      created_at: new Date().toISOString(),
    };
    db.prepare(`
      INSERT INTO reviews (id, place_id, author, rating, comment, created_at)
      VALUES (@id, @place_id, @author, @rating, @comment, @created_at)
    `).run(newReview);
    res.status(201).json(newReview);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Express + SQLite rodando na porta ${PORT}`);
});
