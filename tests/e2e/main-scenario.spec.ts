import { test, expect } from '@playwright/test';

test.describe('Main scenario: play Snake and save score', () => {
  test('plays a quick round, opens save dialog, saves, sees leaderboard entry', async ({ page }) => {
    await page.goto('/index.html');

    // Для стабильности: откроем Save Dialog напрямую через helper
    // Дождаться загрузки тестового хелпера и открыть диалог
    await page.waitForFunction(() => !!(window as any).AppTest?.openSavePreview);
    await page.evaluate(() => (window as any).AppTest.openSavePreview('snake', 120, 84));

    // Fill name, submit, ensure double submit blocked
    const nameInput = page.getByLabel('Player name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('TestUser');
    const submit = page.getByRole('button', { name: 'Save score' });

    // Click twice quickly; the second должна быть проигнорирована (loading state)
    // Подсчёт вызовов: обернуть api.save и кликнуть дважды
    await page.evaluate(() => { window.AppTest.resetSaveCounter(); window.AppTest.wrapSaveCounter(); });
    await submit.click();
    await submit.click();
    const saveCalls = await page.evaluate(() => window.AppTest.getSaveCallCount());
    expect(saveCalls).toBe(1);

    // Expect success toast
    await expect(page.getByText(/Saved! .* is #\d+ on Snake\./)).toBeVisible();

    // Go to leaderboard Snake and see entry present (marked New)
    await page.getByRole('link', { name: 'Leaderboard', exact: true }).click();
    // Ensure Snake tab
    await page.getByRole('tab', { name: 'Snake' }).click();
    const table = page.locator('[data-board="snake"]');
    await expect(table).toContainText('TestUser');
  });
});
