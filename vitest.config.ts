import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: "node",
    environmentMatchGlobs: [
      ["src/components/**/*.test.tsx", "jsdom"],
      ["src/components/**/*.test.ts", "jsdom"],
    ],
    setupFiles: ["src/test/setup.ts"],
    exclude: ["everything-claude-code/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      // models contain only TypeScript interfaces/type aliases — no executable
      // code — so they contribute 0% coverage metrics and skew thresholds.
      // Excluding them surfaces the true coverage of the business logic layer.
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/__tests__/**",
        "src/models/**",
        "src/test/**",
        "src/main.tsx",
        // App.tsx is the UI entry point — covered by E2E/component tests in later phases
        "src/App.tsx",
        // types.ts contains only TypeScript type aliases — no executable code
        "src/state/types.ts",
        // seed.ts is a static data constant — no testable logic
        "src/state/seed.ts",
        // GameContext.tsx is React context wiring — covered by component tests in Phase 2
        "src/state/GameContext.tsx",
        // Barrel index.ts files are pure re-exports — no executable logic to measure
        "src/components/**/index.ts",
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
