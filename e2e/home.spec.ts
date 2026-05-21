import { test, expect } from '@playwright/test';

test('homepage /fr renders SilkRoute OS heading and Clerk panel', async ({ page }) => {
  await page.goto('/fr');
  await expect(page).toHaveURL(/\/fr/);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByTestId('clerk-panel')).toBeVisible({ timeout: 10_000 });
});

test('homepage /en renders SilkRoute OS heading and Clerk panel', async ({ page }) => {
  await page.goto('/en');
  await expect(page).toHaveURL(/\/en/);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByTestId('clerk-panel')).toBeVisible({ timeout: 10_000 });
});
