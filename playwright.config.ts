import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npx http-server . -p 5173 -c-1',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
