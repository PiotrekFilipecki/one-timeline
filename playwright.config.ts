import { defineConfig, devices } from "@playwright/test";

// Jedyny runner. Testy idą przeciw buildowi produkcyjnemu na 3124: dev server ma overlay i HMR,
// które fałszują pomiar układu. `npm test` buduje i startuje sam; działający serwer jest reużywany.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3124", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", testIgnore: /perf\.spec/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    // Pomiary (fps, LCP, długie klatki) dopiero po reszcie, same na maszynie: równoległe workery fałszują czasy.
    { name: "perf", testMatch: /perf\.spec/, dependencies: ["chromium"], use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3124",
    url: "http://localhost:3124",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
