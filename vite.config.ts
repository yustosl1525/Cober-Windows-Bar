import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const srcPath = resolve("./src").replace(/\\/g, "/");

const UTF8_SCRIPT_PATTERN = /\.(?:[cm]?[jt]sx?|css)(?:$|\?)/i;

function enforceUtf8ContentType() {
  function install(server: {
    middlewares: {
      use: (handler: (req: { url?: string }, res: any, next: () => void) => void) => void;
    };
  }) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? "";
      if (!UTF8_SCRIPT_PATTERN.test(url)) {
        next();
        return;
      }

      const response = res as {
        end: (...args: any[]) => any;
        getHeader?: (name: string) => unknown;
        setHeader: (name: string, value: string) => void;
      };
      const originalEnd = response.end.bind(response);

      response.end = (...args: any[]) => {
        const contentType = response.getHeader?.("Content-Type");
        if (typeof contentType === "string") {
          if (!/charset=/i.test(contentType)) {
            if (
              contentType.startsWith("text/javascript") ||
              contentType.startsWith("application/javascript") ||
              contentType.startsWith("text/css")
            ) {
              response.setHeader("Content-Type", `${contentType}; charset=utf-8`);
            }
          }
        } else {
          response.setHeader(
            "Content-Type",
            url.includes(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8",
          );
        }

        return originalEnd(...args);
      };

      next();
    });
  }

  return {
    name: "enforce-utf8-content-type",
    configureServer: install,
    configurePreviewServer: install,
  };
}

export default defineConfig({
  plugins: [react(), enforceUtf8ContentType()],
  resolve: {
    alias: {
      // Mirror the @/* path alias declared in tsconfig.app.json so
      // editors and Vite agree on the same module resolution.
      "@": srcPath,
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the main bundle into the four logical pieces: the
        // React runtime, the animation library, the i18n runtime, and
        // everything else (the app code itself). All four are loaded
        // on the /desktop first-paint, but chunking them makes
        // long-term caching friendlier (an app-only change doesn't
        // bust the react-vendor cache) and gives the bundler
        // visibility into which packages we should treat as
        // "infrastructure" rather than "feature code".
        manualChunks: {
          "react-vendor": [
            "react",
            "react-dom",
            "react-dom/client",
            "scheduler",
          ],
          animation: [
            "framer-motion",
          ],
          i18n: [
            "i18next",
            "react-i18next",
            "i18next-browser-languagedetector",
          ],
        },
      },
    },
  },
});
