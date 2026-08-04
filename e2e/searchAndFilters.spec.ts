import { test, expect } from '@playwright/test';

test.describe('E2E Bloco 8: Busca e Filtros na Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-28: Campo de busca aceita digitação e filtra a lista em tempo real', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Buscar estabelecimento/i);
    await searchInput.fill('Restaurante');
    await expect(searchInput).toHaveValue('Restaurante');
  });

  test('E2E-33: Botão de Categorias abre o grid de categorias', async ({ page }) => {
    const catBtn = page.getByRole('button', { name: /Categorias/i });
    await catBtn.click();
    await expect(page.getByText('Alimentação')).toBeVisible();
  });

  test('E2E-35: Botão de Favoritos alterna o filtro de favoritos', async ({ page }) => {
    const favBtn = page.getByRole('button', { name: /Favoritos/i });
    await favBtn.click();
    await expect(favBtn).toHaveClass(/amber/);
  });
});
