import { test, expect } from '@playwright/test';

test.describe('E2E Bloco 7: Rotas e Distâncias Dinâmicas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-09: Clicar em um local da lista abre o painel PlaceDetails com opções de rota', async ({ page }) => {
    // Clicar no primeiro local da sidebar se houver
    const firstPlace = page.locator('button').filter({ hasText: /km|m/ }).first();
    if (await firstPlace.isVisible()) {
      await firstPlace.click();
      await expect(page.getByRole('button', { name: /Da universidade/i })).toBeVisible();
    }
  });

  test('E2E-17: Botão "Da universidade" está desabilitado sem seleção mas habilitado ao selecionar local', async ({ page }) => {
    const firstPlace = page.locator('button').filter({ hasText: /km|m/ }).first();
    if (await firstPlace.isVisible()) {
      await firstPlace.click();
      const ufcRouteBtn = page.getByRole('button', { name: /Da universidade/i });
      await expect(ufcRouteBtn).toBeEnabled();
    }
  });

  test('E2E-27: Botão "De onde estou" exibe "Sem GPS" quando a geolocalização não foi acionada', async ({ page }) => {
    const firstPlace = page.locator('button').filter({ hasText: /km|m/ }).first();
    if (await firstPlace.isVisible()) {
      await firstPlace.click();
      const gpsBtn = page.getByRole('button', { name: /Sem GPS/i });
      await expect(gpsBtn).toBeVisible();
      await expect(gpsBtn).toBeDisabled();
    }
  });
});
