import { test, expect } from '@playwright/test';

test.describe('Minesweeper save flow', () => {
  test('win -> save -> leaderboard', async ({ page }) => {
    await page.goto('/index.html');
    // Для стабильности: дождаться helper и открыть Save Dialog напрямую
    await page.waitForFunction(() => !!(window as any).AppTest?.openSavePreview);
    await page.evaluate(() => (window as any).AppTest.openSavePreview('minesweeper', 42, 42));
    const name = page.getByLabel('Player name');
    await name.fill('Sweeper');
    await page.getByRole('button', { name: 'Save score' }).click();
    await expect(page.getByText(/Saved! .* is #\d+ on Minesweeper\./)).toBeVisible();
    // Leaderboard (avoid ambiguity: exact link in nav)
    await page.getByRole('link', { name: 'Leaderboard', exact: true }).click();
    await page.getByRole('tab', { name: 'Minesweeper' }).click();
    await expect(page.locator('[data-board="minesweeper"]')).toContainText('Sweeper');
  });
});
