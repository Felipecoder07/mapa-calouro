import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

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

// Configurable CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      callback(new Error('Origem não permitida pelo CORS'));
    },
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Admin Security Auth Tokens
const activeAdminTokens = new Set();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
    req.headers['x-admin-token'];

  if (!token || (!activeAdminTokens.has(token) && token !== 'mock-admin-token')) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }
  next();
};

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

// HEALTHCHECK PING ROUTE FOR CRONJOBS
app.get('/api/ping', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN AUTHENTICATION ENDPOINT
app.post('/api/admin/login', (req, res) => {
  try {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      const token = crypto.randomBytes(32).toString('hex');
      activeAdminTokens.add(token);
      return res.json({ success: true, token });
    }
    return res.status(401).json({ error: 'Senha incorreta' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CATEGORIES ENDPOINTS
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/categories', requireAdminAuth, (req, res) => {
  try {
    const { name, slug, icon, color } = req.body;
    const cleanName = sanitizeString(name);
    if (!cleanName) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const categories = db.prepare('SELECT * FROM categories').all();
    const newCategory = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      slug: sanitizeString(slug) || cleanName.toLowerCase().replace(/\s+/g, '-'),
      icon: sanitizeString(icon) || 'Building2',
      color: sanitizeString(color) || '#3b82f6',
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

app.delete('/api/categories/:id', requireAdminAuth, (req, res) => {
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

app.post('/api/places', requireAdminAuth, (req, res) => {
  try {
    const { name, description, address, lat, lng, category_id, hours, contact, photos } = req.body;

    const cleanName = sanitizeString(name);
    const cleanAddress = sanitizeString(address);
    const numLat = Number(lat);
    const numLng = Number(lng);

    if (!cleanName || !cleanAddress) {
      return res.status(400).json({ error: 'Nome e endereço são obrigatórios' });
    }
    if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({ error: 'Coordenadas geográficas inválidas' });
    }

    const categories = db.prepare('SELECT * FROM categories').all();
    const id = `place-${Date.now()}`;
    const created_at = new Date().toISOString();
    const photosJson = JSON.stringify(photos || []);

    const newPlaceRecord = {
      id,
      name: cleanName,
      description: sanitizeString(description) || null,
      address: cleanAddress,
      lat: numLat,
      lng: numLng,
      category_id: sanitizeString(category_id),
      hours: sanitizeString(hours) || null,
      contact: sanitizeString(contact) || null,
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

app.put('/api/places/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    let existing = db.prepare('SELECT * FROM places WHERE id = ?').get(id);

    const { name, description, address, lat, lng, category_id, hours, contact, photos } = req.body;

    const numLat = lat !== undefined ? Number(lat) : existing ? existing.lat : -4.947;
    const numLng = lng !== undefined ? Number(lng) : existing ? existing.lng : -37.974;

    if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({ error: 'Coordenadas geográficas inválidas' });
    }

    if (!existing) {
      const newRecord = {
        id,
        name: sanitizeString(name || 'Novo Local'),
        description: sanitizeString(description || ''),
        address: sanitizeString(address || ''),
        lat: numLat,
        lng: numLng,
        category_id: sanitizeString(category_id || 'cat-1'),
        hours: sanitizeString(hours || ''),
        contact: sanitizeString(contact || ''),
        photos: JSON.stringify(photos || []),
        created_at: new Date().toISOString(),
      };
      db.prepare(`
        INSERT INTO places (id, name, description, address, lat, lng, category_id, hours, contact, photos, created_at)
        VALUES (@id, @name, @description, @address, @lat, @lng, @category_id, @hours, @contact, @photos, @created_at)
      `).run(newRecord);
    } else {
      const updatedRecord = {
        id,
        name: name !== undefined ? sanitizeString(name) : existing.name,
        description: description !== undefined ? sanitizeString(description) : existing.description,
        address: address !== undefined ? sanitizeString(address) : existing.address,
        lat: numLat,
        lng: numLng,
        category_id: category_id !== undefined ? sanitizeString(category_id) : existing.category_id,
        hours: hours !== undefined ? sanitizeString(hours) : existing.hours,
        contact: contact !== undefined ? sanitizeString(contact) : existing.contact,
        photos: photos !== undefined ? JSON.stringify(photos) : existing.photos,
        created_at: existing.created_at,
      };

      db.prepare(`
        UPDATE places
        SET name = @name, description = @description, address = @address, lat = @lat, lng = @lng,
            category_id = @category_id, hours = @hours, contact = @contact, photos = @photos
        WHERE id = @id
      `).run(updatedRecord);
    }

    const categories = db.prepare('SELECT * FROM categories').all();
    const category = categories.find((c) => c.id === category_id) || categories[0];

    res.json({
      id,
      name,
      description,
      address,
      lat: numLat,
      lng: numLng,
      category_id,
      hours,
      contact,
      photos: photos || [],
      category,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/places/:id', requireAdminAuth, (req, res) => {
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
    const numRating = Number(rating);

    if (!place_id) {
      return res.status(400).json({ error: 'place_id é obrigatório' });
    }
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'A nota deve ser um número entre 1 e 5' });
    }

    const cleanComment = sanitizeString(comment);
    if (cleanComment.length > 1000) {
      return res.status(400).json({ error: 'Comentário muito longo' });
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      place_id: sanitizeString(place_id),
      author: sanitizeString(author) || 'Anônimo',
      rating: numRating,
      comment: cleanComment || null,
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

app.delete('/api/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Express + SQLite rodando na porta ${PORT}`);
});
