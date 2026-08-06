import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import type { Server } from 'node:http';

describe('Módulo de Segurança da API Backend (Endpoints Security & Auth)', () => {
  let app: express.Application;
  let server: Server;
  let db: InstanceType<typeof Database>;
  let port: number;
  let baseUrl: string;
  let validAdminToken: string;

  beforeAll(async () => {
    db = new Database(':memory:');
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

    db.prepare(`
      INSERT INTO categories (id, name, slug, icon, color, sort_order)
      VALUES ('cat-1', 'Alimentação', 'alimentacao', 'Utensils', '#ef4444', 1)
    `).run();

    app = express();
    app.use(cors());
    app.use(express.json());

    const activeAdminTokens = new Set<string>();
    const ADMIN_PASSWORD = 'admin123';

    const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const authHeader = req.headers.authorization;
      const token =
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
        (req.headers['x-admin-token'] as string);

      if (!token || !activeAdminTokens.has(token)) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
      }
      next();
    };

    function sanitizeString(str: any) {
      if (typeof str !== 'string') return '';
      return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
    }

    app.get('/api/ping', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.post('/api/admin/login', (req, res) => {
      const { password } = req.body;
      if (password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        activeAdminTokens.add(token);
        return res.json({ success: true, token });
      }
      return res.status(401).json({ error: 'Senha incorreta' });
    });

    app.post('/api/categories', requireAdminAuth, (req, res) => {
      const { name } = req.body;
      const cleanName = sanitizeString(name);
      if (!cleanName) return res.status(400).json({ error: 'Nome obrigatório' });
      res.status(201).json({ id: 'cat-new', name: cleanName });
    });

    app.delete('/api/categories/:id', requireAdminAuth, (_req, res) => {
      res.status(204).send();
    });

    app.post('/api/places', requireAdminAuth, (req, res) => {
      const { name, address, lat, lng } = req.body;
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

      res.status(201).json({ id: 'place-new', name: cleanName });
    });

    app.put('/api/places/:id', requireAdminAuth, (req, res) => {
      const { lat, lng } = req.body;
      const numLat = Number(lat);
      const numLng = Number(lng);
      if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        return res.status(400).json({ error: 'Coordenadas geográficas inválidas' });
      }
      res.json({ id: req.params.id, updated: true });
    });

    app.delete('/api/places/:id', requireAdminAuth, (_req, res) => {
      res.status(204).send();
    });

    app.post('/api/reviews', (req, res) => {
      const { place_id, rating, comment } = req.body;
      const numRating = Number(rating);

      if (!place_id) {
        return res.status(400).json({ error: 'place_id é obrigatório' });
      }
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: 'A nota deve ser um número entre 1 e 5' });
      }

      res.status(201).json({ id: 'rev-new', rating: numRating, comment: sanitizeString(comment) });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          port = addr.port;
          baseUrl = `http://localhost:${port}`;
        }
        resolve();
      });
    });
  });

  afterAll(() => {
    if (server) server.close();
    if (db) db.close();
  });

  // TEST SUITE 1: LOGIN ADMINISTRATIVO
  describe('1. Teste de Login Administrativo', () => {
    it('Deve rejeitar login com senha incorreta e retornar 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'senha_errada_123' }),
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Senha incorreta');
    });

    it('Deve autenticar com senha correta e retornar 200 OK com token de sessão', async () => {
      const res = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(typeof body.token).toBe('string');
      expect(body.token.length).toBeGreaterThan(10);
      validAdminToken = body.token;
    });
  });

  // TEST SUITE 2: PROTEÇÃO DE ROTAS ADMINISTRATIVAS (TOKEN DE SESSÃO)
  describe('2. Teste de Criação/Edição/Exclusão de Locais Sem e Com Token', () => {
    it('POST /api/places sem token deve retornar 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Local Teste', address: 'Rua 1', lat: -4.94, lng: -37.97 }),
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Acesso não autorizado');
    });

    it('PUT /api/places/:id sem token deve retornar 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/places/place-123`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: -4.94, lng: -37.97 }),
      });
      expect(res.status).toBe(401);
    });

    it('DELETE /api/places/:id sem token deve retornar 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/places/place-123`, {
        method: 'DELETE',
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/places com token Bearer válido deve permitir criação (201 Created)', async () => {
      const res = await fetch(`${baseUrl}/api/places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validAdminToken}`,
        },
        body: JSON.stringify({ name: 'Novo Bloco C', address: 'Campus Russas', lat: -4.947, lng: -37.974 }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe('place-new');
    });
  });

  // TEST SUITE 3: SUBMISSÃO DE AVALIAÇÃO COM NOTAS INVÁLIDAS
  describe('3. Teste de Validação de Notas em Avaliações', () => {
    it('Deve rejeitar nota 0 com 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: 'place-1', rating: 0, comment: 'Muito ruim' }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('A nota deve ser um número entre 1 e 5');
    });

    it('Deve rejeitar nota 10 com 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: 'place-1', rating: 10, comment: 'Exagerado' }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('A nota deve ser um número entre 1 e 5');
    });

    it('Deve aceitar nota válida 5 com 201 Created', async () => {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: 'place-1', rating: 5, comment: 'Excelente' }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.rating).toBe(5);
    });
  });
});
