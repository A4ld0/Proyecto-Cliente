import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const baseURL = 'http://127.0.0.1:4307';
const testDir = defineBddConfig({
  features: 'system-tests/**/*.feature',
  steps: 'system-tests/**/*.steps.ts',
  outputDir: 'tmp/system-features'
});

export default defineConfig({
  testDir,
  outputDir: 'tmp/system-results',
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npm start -- --host 127.0.0.1 --port 4307',
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: false
  }
});
