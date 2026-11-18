import { expect, test } from '@playwright/test';

test('login page renders and is keyboard reachable', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  // Tab moves focus into the form
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});

test('unknown route shows not-found', async ({ page }) => {
  await page.goto('/this-does-not-exist');
  await expect(page.getByText(/not found/i)).toBeVisible();
});
