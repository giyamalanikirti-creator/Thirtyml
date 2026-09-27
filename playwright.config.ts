import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config. `PLAYWRIGHT_BASE_URL` selects preview or local. In CI
 * we deploy a Vercel preview first and point at it — see the CI workflow.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    // Playwright downloads its browser to the pre-installed location when
    // available (see PLAYWRIGHT_BROWSERS_PATH).
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: "npm run start", port: 3000, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
