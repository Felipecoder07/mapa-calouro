import { describe, it, expect } from 'vitest';
import { test, expect as playwrightExpect } from '@playwright/test';

test.describe('E2E Bloco 10: Painel Admin e Autenticação', () => {
  test('E2E-46: Acessar rota /admin exibe a tela de login protegida', async ({ page }) => {
    await page.goto('/#/admin');
    await playwrightExpect(page.getByText('Painel Administrativo')).toBeVisible();
    await playwrightExpect(page.getByPlaceholder('Senha')).toBeVisible();
  });

  test('E2E-48: Fazer login com a senha admin123 libera o painel administrativo', async ({ page }) => {
    await page.goto('/#/admin');
    await page.getByPlaceholder('Senha').fill('admin123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await playwrightExpect(page.getByRole('button', { name: /Novo local/i })).toBeVisible();
  });

  test('E2E-49: Botão "Voltar ao mapa" redireciona para a tela principal', async ({ page }) => {
    await page.goto('/#/admin');
    await page.getByRole('button', { name: /Voltar ao mapa/i }).click();
    await playwrightExpect(page.locator('.leaflet-container')).toBeVisible();
  });
});
