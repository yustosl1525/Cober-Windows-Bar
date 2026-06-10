/**
 * Vitest global setup — initializes i18n, jest-dom matchers, and
 * auto-cleanup between tests.
 */
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import "@testing-library/jest-dom/vitest";
import en from "../i18n/en.json";
import zhCN from "../i18n/zh-CN.json";

// Standalone i18n init (no LanguageDetector) — English by default for assertions.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "zh-CN": { translation: zhCN },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Ensure the DOM is torn down between tests so render() doesn't accumulate.
afterEach(() => {
  cleanup();
});
