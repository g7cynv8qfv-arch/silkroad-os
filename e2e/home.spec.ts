import { test, expect } from '@playwright/test';

test('homepage renders SilkRoute OS in French (default locale)', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/fr/);
  await expect(page.getByRole('heading', { name: 'SilkRoute OS' })).toBeVisible();
});

test('homepage renders SilkRoute OS in English', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: 'SilkRoute OS' })).toBeVisible();
});
