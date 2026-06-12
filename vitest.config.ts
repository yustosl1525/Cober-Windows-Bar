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
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.vitest.{ts,tsx}"],
    globals: false,
    css: false,
  },
});
