import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';

describe('Módulo 5: Testes de Segurança [SEC]', () => {
  it('SEC-03: Prevenção de SQL Injection via prepared statements no SQLite', () => {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE places (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    const maliciousInput = "'; DROP TABLE places;--";
    const stmt = db.prepare('INSERT INTO places (id, name) VALUES (?, ?)');
    
    // Prepared statement treats payload as literal string, avoiding SQL Injection
    stmt.run('place-1', maliciousInput);

    const place = db.prepare('SELECT * FROM places WHERE id = ?').get('place-1') as any;
    expect(place).toBeDefined();
    expect(place.name).toBe(maliciousInput);

    // Verify table was NOT dropped
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='places'").get();
    expect(tableCheck).toBeDefined();
  });

  it('SEC-06: Escape de caracteres perigosos em Strings (Simulação de XSS)', () => {
    const xssPayload = "<script>alert('XSS')</script>";
    const div = document.createElement('div');
    div.textContent = xssPayload; // React style string escaping

    expect(div.innerHTML).toBe('&lt;script&gt;alert(\'XSS\')&lt;/script&gt;');
    expect(div.children.length).toBe(0);
  });
});
