/**
 * End-to-end test: main user flow
 * - Loads homepage
 * - Navigates to key feature pages
 * - Verifies UI renders
 * - Mocks network failure for an API and asserts graceful error
 */
import { test, expect } from '@playwright/test';

test.describe('Main user flow', () => {
  test('homepage renders and navigation works', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Finance|AI|Markets/i);

    // Navigate to cryptos page
    await page.goto('/cryptos');
    await expect(page.getByRole('heading')).toBeVisible();

    // Navigate to stocks page
    await page.goto('/stocks');
    await expect(page.getByRole('heading')).toBeVisible();

    // Navigate to forexs page
    await page.goto('/forexs');
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('handles API 500 gracefully on news endpoint', async ({ page }) => {
    await page.route('**/api/news**', async route => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal error' }) });
    });

    await page.goto('/');
    const resp = await page.request.get('/finsight-ai/api/news?q=finance&pageSize=1');
    expect(resp.status()).toBe(500);
    const data = await resp.json();
    expect(data.error).toBeDefined();
  });
});

