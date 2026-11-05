// Captura documental: interface real com snapshot somente leitura do SQLite local.
// Requer Vite em http://127.0.0.1:5174 com envDir:false (sem Supabase).
import { chromium } from '@playwright/test';
import Database from 'better-sqlite3';
import { mkdir, writeFile } from 'node:fs/promises';

const db = new Database('data/database.sqlite', { readonly: true });
const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
const places = db.prepare('SELECT * FROM places ORDER BY name').all().map(p => ({
  ...p,
  photos: JSON.parse(p.photos || '[]'),
  category: categories.find(c => c.id === p.category_id),
}));
db.close();
await mkdir('docs/screenshots', { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // Bloqueia a nuvem mesmo se o processo Vite herdar variáveis do ambiente.
  await context.route(url => url.hostname.endsWith('.supabase.co'), route => route.abort());
  await context.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const body = path === '/api/categories' ? categories : path === '/api/places' ? places : [];
    return route.fulfill({ json: body });
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5174', { waitUntil: 'domcontentloaded' });
  await page.locator('.leaflet-container').waitFor();
  await page.getByText(`${places.length} locais encontrados`, { exact: true }).waitFor();
  await page.locator('.leaflet-control-layers').hover();
  await page.getByText('Satélite HD (ArcGIS/Esri)', { exact: false }).click();
  await page.mouse.move(350, 80);
  await page.waitForFunction(() => [...document.querySelectorAll('.leaflet-tile')].some(n => n.complete && n.naturalWidth > 0), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'docs/screenshots/01-mapa-desktop.png' });
  await page.getByPlaceholder('Buscar local, restaurante, sala...').fill('Arena Cristo Rey');
  await page.getByText('Arena Cristo Rey', { exact: true }).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/screenshots/02-detalhes-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshots/03-detalhes-mobile.png' });
  const tiles = await page.locator('.leaflet-tile').evaluateAll(nodes => ({ total: nodes.length, loaded: nodes.filter(n => n.complete && n.naturalWidth > 0).length }));
  await writeFile('docs/screenshots/capture.json', JSON.stringify({
    capturedAt: new Date().toISOString(), url: page.url(),
    source: 'Snapshot somente leitura de data/database.sqlite; API interceptada no navegador; avaliações vazias; sem acesso ao Supabase.',
    places: places.length, tiles, viewports: ['1440x900', '390x844'],
    scope: 'Interface da cópia de trabalho; não valida backend, deploy ou aparelho físico.'
  }, null, 2) + '\n');
  console.log(JSON.stringify({ places: places.length, tiles }));
} finally {
  await browser.close();
}
