import { test, expect } from '@playwright/test';

test.describe('E2E Bloco 11: Responsividade Mobile (Pixel 5)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('MOB-01: Em telas pequenas o botão ☰ Locais fica visível', async ({ page }) => {
    await page.goto('/');
    const drawerBtn = page.getByRole('button', { name: /Locais/i });
    await expect(drawerBtn).toBeVisible();
  });

  test('MOB-02: Clicar no botão ☰ abre o drawer com a busca e categorias em mobile', async ({ page }) => {
    await page.goto('/');
    const drawerBtn = page.getByRole('button', { name: /Locais/i });
    await drawerBtn.click();
    await expect(page.getByPlaceholder(/Buscar estabelecimento/i)).toBeVisible();
  });
});
