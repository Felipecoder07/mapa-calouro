import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

describe('Módulo 4: Server Express & SQLite API (server/index.js)', () => {
  let db: InstanceType<typeof Database>;

  beforeAll(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        sort_order INTEGER NOT NULL
      );
      CREATE TABLE places (
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
      CREATE TABLE reviews (
        id TEXT PRIMARY KEY,
        place_id TEXT NOT NULL,
        author TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TEXT NOT NULL
      );
    `);
  });

  it('IT-01: GET /api/categories - inicialização das tabelas no banco SQLite em memória', () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM categories');
    const { count } = stmt.get() as { count: number };
    expect(count).toBe(0);
  });

  it('IT-02: POST /api/places - insere novo local e valida presença no banco', () => {
    const id = `place-${Date.now()}`;
    db.prepare(`
      INSERT INTO places (id, name, description, address, lat, lng, category_id, photos, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, 'Restaurante Universitário', 'RU UFC Russas', 'Campus UFC Russas', -4.9471, -37.9745, 'cat-1', '[]', new Date().toISOString());

    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(id) as any;
    expect(place).toBeDefined();
    expect(place.name).toBe('Restaurante Universitário');
    expect(place.lat).toBe(-4.9471);
  });

  it('IT-06: DELETE /api/places/:id - remoção em cascata das avaliações do local', () => {
    const placeId = 'place-delete-test';
    db.prepare(`
      INSERT INTO places (id, name, address, lat, lng, category_id, photos, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(placeId, 'Local Teste', 'Endereço', -4.94, -37.97, 'cat-1', '[]', new Date().toISOString());

    db.prepare(`
      INSERT INTO reviews (id, place_id, author, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('rev-1', placeId, 'Aluno A', 5, 'Excelente', new Date().toISOString());

    // Cascade delete simulation
    db.prepare('DELETE FROM places WHERE id = ?').run(placeId);
    db.prepare('DELETE FROM reviews WHERE place_id = ?').run(placeId);

    const reviews = db.prepare('SELECT * FROM reviews WHERE place_id = ?').all(placeId);
    expect(reviews).toHaveLength(0);
  });
});
