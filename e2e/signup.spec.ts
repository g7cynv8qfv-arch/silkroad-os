/**
 * E2E signup flow — Clerk dev mode with magic test email (+clerk_test suffix).
 *
 * Uses @clerk/testing to bypass Turnstile CAPTCHA in headless mode.
 * CLERK_SECRET_KEY must be set in .env.local (loaded via playwright.config.ts).
 *
 * Clerk test mode: emails ending in +clerk_test@<domain> bypass email delivery
 * and accept OTP code 424242.
 */

import { test, expect, type Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function testEmail(): string {
  // Must be <unique-local>+clerk_test@<domain> — the full tag must be +clerk_test
  return `e2e${Date.now()}+clerk_test@example.com`;
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: false });
}

// ─── Home page rendering tests ────────────────────────────────────────────────

test('home /fr renders holographic panel and Clerk card', async ({ page }) => {
  await page.goto('/fr');
  await expect(page).toHaveURL(/\/fr/);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByTestId('clerk-panel')).toBeVisible({ timeout: 10_000 });
  await screenshot(page, 'home-fr');
});

test('home /en renders holographic panel and Clerk card', async ({ page }) => {
  await page.goto('/en');
  await expect(page).toHaveURL(/\/en/);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByTestId('clerk-panel')).toBeVisible({ timeout: 10_000 });
  await screenshot(page, 'home-en');
});

// ─── Full signup flow ─────────────────────────────────────────────────────────

test('full signup → onboarding → dashboard (run 1)', async ({ page }) => {
  test.setTimeout(180_000);
  await runSignupFlow(page, 'Test', `E2E Org ${Date.now()}`);
});

test('full signup → onboarding → dashboard (run 2 — idempotency)', async ({ page }) => {
  test.setTimeout(180_000);
  await runSignupFlow(page, 'User2', `E2E Org B ${Date.now()}`);
});

// ─── Shared signup flow helper ────────────────────────────────────────────────

async function runSignupFlow(page: Page, lastName: string, orgName: string): Promise<void> {
  const email = testEmail();
  const password = 'xQp#m9Kv2$rL8vNz'; // Random password unlikely to be in HIBP

  // Inject Clerk testing token to bypass Turnstile CAPTCHA in headless mode
  await setupClerkTestingToken({ page });

  // ── Step 1: Verify home page shows Clerk panel ──────────────────────────────
  await page.goto('/fr');
  await expect(page).toHaveURL(/\/fr/);
  await expect(page.getByTestId('clerk-panel')).toBeVisible({ timeout: 10_000 });
  await screenshot(page, `step-1-home-${lastName}`);

  // ── Step 2: Navigate to sign-up page ────────────────────────────────────────
  await page.goto('/fr/sign-up');
  await page.waitForURL(/\/fr\/sign-up/);
  await page.waitForLoadState('networkidle');

  await page.locator('#firstName').fill('E2E');
  await page.locator('#lastName').fill(lastName);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  await screenshot(page, `step-2-register-${lastName}`);
  await page.getByRole('button', { name: /créer mon compte|create account/i }).click();

  // ── Step 3: OTP verification ────────────────────────────────────────────────
  // The sign-up form transitions to verify step in-place (same URL).
  // +clerk_test emails in dev mode accept code 424242.
  const otpInput = page.locator('#code');
  await expect(otpInput).toBeVisible({ timeout: 20_000 });

  await screenshot(page, `step-3-otp-${lastName}`);
  await otpInput.fill('424242');
  await page.getByRole('button', { name: /vérifier|verify/i }).click();

  // ── Step 4: Onboarding ──────────────────────────────────────────────────────
  await page.waitForURL(/\/fr\/onboarding/, { timeout: 20_000 });
  await screenshot(page, `step-4-onboarding-${lastName}`);

  const orgInput = page.locator('#orgName');
  await expect(orgInput).toBeVisible({ timeout: 8_000 });
  await orgInput.fill(orgName);

  await page.getByRole('button', { name: /créer l'organisation|create organization/i }).click();

  // ── Step 5: Dashboard ───────────────────────────────────────────────────────
  await page.waitForURL(/\/fr\/dashboard/, { timeout: 25_000 });
  await screenshot(page, `step-5-dashboard-${lastName}`);

  await expect(page).toHaveURL(/\/fr\/dashboard/);
  const dashMain = page.locator('main').first();
  await expect(dashMain).toBeVisible({ timeout: 10_000 });

  // Drain Clerk background requests before test teardown to prevent
  // route.fetch "Test ended." errors from contaminating the next test's
  // setupClerkTestingToken network interception.
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
}
