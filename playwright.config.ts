import { defineConfig, devices } from '@playwright/test';

// nov26-m3-t1: NagaIME の e2e の土台（前例: Weiwudi の playwright.config.js）。
// - e2e は tests/（vitest の領分）ではなく e2e/ に置く（vitest.config.ts の exclude で拾わせない）
// - dev server は pnpm を経由せず tsx＋vite を直に起こす（clone の workspace 設定の有無に左右されない）
// - ポート 4179 は他リポジトリの dev server（5173）と衝突させないため。--strictPort で黙って移らない
// - BROWSER=none: vite.config.ts の server.open: true でブラウザを開かせない
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4179',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command:
      'node_modules/.bin/tsx scripts/build-dictionary.ts && node_modules/.bin/vite --host 127.0.0.1 --port 4179 --strictPort',
    url: 'http://127.0.0.1:4179/e2e/fixtures/f-clean.html',
    reuseExistingServer: !process.env.CI,
    env: { BROWSER: 'none' },
    timeout: 120_000,
  },
});
