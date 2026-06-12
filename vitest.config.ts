import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const srcPath = resolve("./src").replace(/\\/g, "/");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the @/* path alias declared in tsconfig.app.json so
      // tests can import via the same short paths as production code.
      "@": srcPath,
    },
  },
  test: {
    environment: "jsdom",
    // Two setup files: setup.ts initializes i18n + jest-dom matchers;
    // legacy-test-shim.ts installs a global test() that delegates to
    // vitest's it() so the 14 legacy .test.ts files run unmodified.
    setupFiles: [
      "./src/test/setup.ts",
      "./src/test/legacy-test-shim.ts",
    ],
    // Pick up both naming conventions. The .vitest.* files use vitest's
    // native it()/expect(); the .test.* files use the legacy custom
    // test() helper that's now provided by legacy-test-shim.ts.
    include: [
      "src/**/*.vitest.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
    ],
    globals: false,
    css: false,
  },
});
