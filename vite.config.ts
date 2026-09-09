/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset URLs so the build works at any path — "/" locally,
  // "/<repo>/" on GitHub Pages project sites. Safe here: no client-side routing.
  base: "./",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/components/icons.tsx",
        // Browser-only I/O seams — verified end-to-end by Playwright, not jsdom.
        "src/lib/canvas.ts",
        "src/lib/clipboard.ts",
      ],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
});
