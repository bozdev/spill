import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.mjs",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4400", trace: "retain-on-failure" },
  webServer: { command: "node tests/server.mjs", url: "http://localhost:4400/tests/fixture.html", reuseExistingServer: true, timeout: 30_000 },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } } },
    { name: "phone", use: { ...devices["iPhone 13"] } },
  ],
});
