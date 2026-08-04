import { test, expect } from '@playwright/test';

test.describe('E2E Bloco 6: Mapa e Interação em Tela Real', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-01: Mapa carrega centrado e visível', async ({ page }) => {
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });

  test('E2E-02: Marcador da UFC Russas está presente no mapa', async ({ page }) => {
    const ufcMarker = page.locator('.university-marker');
    await expect(ufcMarker).toBeVisible();
  });

  test('E2E-03: Botões da barra superior (Onde estou e Admin) estão visíveis', async ({ page }) => {
    const locateBtn = page.getByRole('button', { name: /Onde estou|Localizado/i });
    const adminBtn = page.getByRole('button', { name: /Admin/i });
    await expect(locateBtn).toBeVisible();
    await expect(adminBtn).toBeVisible();
  });

  test('E2E-07: Clicar no marcador da UFC exibe popup explicativo', async ({ page }) => {
    const ufcMarker = page.locator('.university-marker');
    await ufcMarker.click();
    await expect(page.getByText('UFC Russas')).toBeVisible();
  });
});
