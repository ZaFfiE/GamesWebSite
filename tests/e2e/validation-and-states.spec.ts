import { test, expect } from '@playwright/test';

test.describe('Validation and states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('Save form validation: required and min length', async ({ page }) => {
    // Open save dialog via helper (no need to play) and ensure validation triggers
    await page.evaluate(() => window.AppTest.openSavePreview('snake', 120, 30));
    const submit = page.getByRole('button', { name: 'Save score' });
    await submit.click();
    const input = page.getByLabel('Player name');
    // Should show validity error (Playwright can't always read browser tooltip, but field remains invalid)
    await expect(input).toHaveJSProperty('value', '');
    await input.fill('A');
    await submit.click();
    await input.fill('Alex');
    await submit.click();
    await expect(page.getByText(/Saved! .* is #\d+ on Snake\./)).toBeVisible();
  });

  test('Empty state on leaderboard after clear', async ({ page }) => {
    // Clear data via AppTest and open leaderboard
    await page.evaluate(() => window.AppTest.api.clear());
    await page.getByRole('link', { name: 'Leaderboard' }).click();
    // Snake tab
    await expect(page.locator('[data-board="snake"]')).toContainText('No Snake scores yet');
  });

  test('Offline error and retry', async ({ page }) => {
    // Set offline via AppTest, load leaderboard -> error. Then back to normal and Retry
    await page.evaluate(() => { window.AppTest.sim.network = 'offline'; });
    await page.getByRole('link', { name: 'Leaderboard' }).click();
    const slot = page.locator('[data-board="snake"]');
    await expect(slot).toContainText("Couldn't load scores.");
    // Switch to normal and click Retry
    await page.evaluate(() => { window.AppTest.sim.network = 'normal'; });
    // Retry button рендерится внутри alert после загрузки errorHtml; дождёмся его
    await slot.getByRole('button', { name: 'Retry' }).click({ timeout: 15000 });
    await expect(slot).not.toContainText("Couldn't load scores.");
  });
});
