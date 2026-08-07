import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/database.sqlite');
if (!fs.existsSync(dbPath)) {
  console.log('Banco de dados SQLite não encontrado.');
  process.exit(0);
}

const db = new Database(dbPath);

const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
const places = db.prepare('SELECT * FROM places ORDER BY created_at ASC').all();
const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at ASC').all();

let sqlOutput = `-- ======================================================\n`;
sqlOutput += `-- SCRIPT DE MIGRAÇÃO AUTOMÁTICA DO SQLITE PARA O SUPABASE\n`;
sqlOutput += `-- Executar no SQL Editor do Supabase\n`;
sqlOutput += `-- ======================================================\n\n`;

sqlOutput += `-- 1. CRIAR ESTRUTURA DAS TABELAS\n`;
sqlOutput += `CREATE TABLE IF NOT EXISTS categories (\n`;
sqlOutput += `  id TEXT PRIMARY KEY,\n`;
sqlOutput += `  name TEXT NOT NULL,\n`;
sqlOutput += `  slug TEXT NOT NULL,\n`;
sqlOutput += `  icon TEXT NOT NULL,\n`;
sqlOutput += `  color TEXT NOT NULL,\n`;
sqlOutput += `  sort_order INT NOT NULL DEFAULT 0\n`;
sqlOutput += `);\n\n`;

sqlOutput += `CREATE TABLE IF NOT EXISTS places (\n`;
sqlOutput += `  id TEXT PRIMARY KEY,\n`;
sqlOutput += `  name TEXT NOT NULL,\n`;
sqlOutput += `  description TEXT,\n`;
sqlOutput += `  address TEXT NOT NULL,\n`;
sqlOutput += `  lat DOUBLE PRECISION NOT NULL,\n`;
sqlOutput += `  lng DOUBLE PRECISION NOT NULL,\n`;
sqlOutput += `  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,\n`;
sqlOutput += `  hours TEXT,\n`;
sqlOutput += `  contact TEXT,\n`;
sqlOutput += `  photos JSONB NOT NULL DEFAULT '[]'::jsonb,\n`;
sqlOutput += `  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n`;
sqlOutput += `);\n\n`;

sqlOutput += `CREATE TABLE IF NOT EXISTS reviews (\n`;
sqlOutput += `  id TEXT PRIMARY KEY,\n`;
sqlOutput += `  place_id TEXT REFERENCES places(id) ON DELETE CASCADE,\n`;
sqlOutput += `  author TEXT NOT NULL,\n`;
sqlOutput += `  rating INT NOT NULL,\n`;
sqlOutput += `  comment TEXT,\n`;
sqlOutput += `  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n`;
sqlOutput += `);\n\n`;

sqlOutput += `ALTER TABLE categories ENABLE ROW LEVEL SECURITY;\n`;
sqlOutput += `ALTER TABLE places ENABLE ROW LEVEL SECURITY;\n`;
sqlOutput += `ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;\n\n`;

sqlOutput += `DROP POLICY IF EXISTS "Leitura publica categorias" ON categories;\n`;
sqlOutput += `CREATE POLICY "Leitura publica categorias" ON categories FOR SELECT USING (true);\n\n`;

sqlOutput += `DROP POLICY IF EXISTS "Leitura publica locais" ON places;\n`;
sqlOutput += `CREATE POLICY "Leitura publica locais" ON places FOR SELECT USING (true);\n\n`;

sqlOutput += `DROP POLICY IF EXISTS "Leitura publica avaliacoes" ON reviews;\n`;
sqlOutput += `CREATE POLICY "Leitura publica avaliacoes" ON reviews FOR SELECT USING (true);\n\n`;

sqlOutput += `DROP POLICY IF EXISTS "Escrita categorias" ON categories;\n`;
sqlOutput += `CREATE POLICY "Escrita categorias" ON categories FOR ALL USING (true);\n\n`;

sqlOutput += `DROP POLICY IF EXISTS "Escrita locais" ON places;\n`;
sqlOutput += `CREATE POLICY "Escrita locais" ON places FOR ALL USING (true);\n\n`;

sqlOutput += `DROP POLICY IF EXISTS "Escrita avaliacoes" ON reviews;\n`;
sqlOutput += `CREATE POLICY "Escrita avaliacoes" ON reviews FOR ALL USING (true);\n\n`;

sqlOutput += `-- 2. INSERIR CATEGORIAS DO SQLITE\n`;
if (categories.length > 0) {
  for (const c of categories) {
    sqlOutput += `INSERT INTO categories (id, name, slug, icon, color, sort_order) VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.slug}', '${c.icon}', '${c.color}', ${c.sort_order}) ON CONFLICT (id) DO NOTHING;\n`;
  }
}

sqlOutput += `\n-- 3. INSERIR LOCAIS DO SQLITE\n`;
if (places.length > 0) {
  for (const p of places) {
    const desc = p.description ? `'${p.description.replace(/'/g, "''")}'` : 'NULL';
    const hours = p.hours ? `'${p.hours.replace(/'/g, "''")}'` : 'NULL';
    const contact = p.contact ? `'${p.contact.replace(/'/g, "''")}'` : 'NULL';
    const photos = p.photos ? `'${p.photos.replace(/'/g, "''")}'::jsonb` : `'[]'::jsonb`;
    const createdAt = p.created_at ? `'${p.created_at}'` : 'NOW()';
    sqlOutput += `INSERT INTO places (id, name, description, address, lat, lng, category_id, hours, contact, photos, created_at) VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', ${desc}, '${p.address.replace(/'/g, "''")}', ${p.lat}, ${p.lng}, '${p.category_id}', ${hours}, ${contact}, ${photos}, ${createdAt}) ON CONFLICT (id) DO NOTHING;\n`;
  }
}

sqlOutput += `\n-- 4. INSERIR AVALIAÇÕES DO SQLITE\n`;
if (reviews.length > 0) {
  for (const r of reviews) {
    const comment = r.comment ? `'${r.comment.replace(/'/g, "''")}'` : 'NULL';
    const createdAt = r.created_at ? `'${r.created_at}'` : 'NOW()';
    sqlOutput += `INSERT INTO reviews (id, place_id, author, rating, comment, created_at) VALUES ('${r.id}', '${r.place_id}', '${r.author.replace(/'/g, "''")}', ${r.rating}, ${comment}, ${createdAt}) ON CONFLICT (id) DO NOTHING;\n`;
  }
}

const outputPath = path.join(__dirname, '../data/supabase_seed.sql');
fs.writeFileSync(outputPath, sqlOutput, 'utf8');
console.log(`Gerado com sucesso! Arquivo salvo em: ${outputPath}`);
