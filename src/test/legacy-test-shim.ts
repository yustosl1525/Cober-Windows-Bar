/**
 * Vitest setup file for the legacy *.test.ts files.
 *
 * The 14 .test.ts files predate vitest. They use:
 *   1. A local `function test(name, run) { ... }` helper
 *      (already stripped by scripts/strip-legacy-test-fn.py).
 *   2. A `import { strict as assert } from "node:assert"` (or
 *      `import assert from "node:assert/strict"`) for assertions.
 *
 * Rather than rewrite all 14 files (each with 20-100 test cases), this
 * shim:
 *   - Installs a global `test()` that delegates to vitest's tracked `it()`.
 *   - Installs a global `assert` that wraps vitest's `expect()` so the
 *     legacy `assert.equal(x, y)` / `assert.deepEqual(a, b)` / etc.
 *     syntax keeps working unmodified.
 *
 * The setupFile is loaded by vitest.config.ts and runs once per test
 * file. The legacy files strip their local `function test(name, run)`
 * declarations (see scripts/strip-legacy-test-fn.py); without that
 * step, the local function would shadow the global below.
 *
 * Note: the `ok ${name}` log line is preserved so the existing
 * `npm run test:state` QA scripts that grep on it still work.
 */
import { it, expect } from "vitest";

declare global {
  // eslint-disable-next-line no-var
  var test: (name: string, run: () => void) => void;
  // eslint-disable-next-line no-var
  var assert: {
    equal: (actual: unknown, expected: unknown, message?: string) => void;
    notEqual: (actual: unknown, expected: unknown, message?: string) => void;
    deepEqual: (actual: unknown, expected: unknown, message?: string) => void;
    notDeepEqual: (actual: unknown, expected: unknown, message?: string) => void;
    ok: (value: unknown, message?: string) => void;
    notOk: (value: unknown, message?: string) => void;
    strictEqual: (actual: unknown, expected: unknown, message?: string) => void;
    notStrictEqual: (actual: unknown, expected: unknown, message?: string) => void;
    deepStrictEqual: (actual: unknown, expected: unknown, message?: string) => void;
    throws: (fn: () => unknown, message?: string) => void;
    doesNotThrow: (fn: () => unknown, message?: string) => void;
    fail: (message?: string) => void;
  };
}

globalThis.test = (name: string, run: () => void): void => {
  // Delegate to vitest's tracked it() so the test appears in the run report.
  it(name, () => {
    run();
  });
  // Preserve the legacy `ok ${name}` console output for QA grep hooks.
  // eslint-disable-next-line no-console
  console.log(`ok ${name}`);
};

// Polyfill the node:assert API surface so the legacy test files
// keep working unmodified. The polyfill uses vitest's expect() under
// the hood, so failure messages and stack traces are vitest-quality.
function buildAssertMessage(message: string | undefined, suffix: string): string {
  return message ? `${message} (${suffix})` : suffix;
}

globalThis.assert = {
  equal(actual, expected, message) {
    expect(actual, buildAssertMessage(message, "equal")).toBe(expected);
  },
  notEqual(actual, expected, message) {
    expect(actual, buildAssertMessage(message, "notEqual")).not.toBe(expected);
  },
  strictEqual(actual, expected, message) {
    expect(actual, buildAssertMessage(message, "strictEqual")).toBe(expected);
  },
  notStrictEqual(actual, expected, message) {
    expect(actual, buildAssertMessage(message, "notStrictEqual")).not.toBe(expected);
  },
  deepEqual(actual, expected, message) {
    expect(actual, buildAssertMessage(message, "deepEqual")).toEqual(expected);
  },
  notDeepEqual(actual, expected, message) {
    expect(actual, buildAssertMessage(message, "notDeepEqual")).not.toEqual(expected);
  },
  deepStrictEqual(actual, expected, message) {
    expect(actual, buildAssertMessage(message, "deepStrictEqual")).toEqual(expected);
  },
  ok(value, message) {
    expect(value, buildAssertMessage(message, "ok")).toBeTruthy();
  },
  notOk(value, message) {
    expect(value, buildAssertMessage(message, "notOk")).toBeFalsy();
  },
  throws(fn, message) {
    expect(fn, buildAssertMessage(message, "throws")).toThrow();
  },
  doesNotThrow(fn, message) {
    expect(fn, buildAssertMessage(message, "doesNotThrow")).not.toThrow();
  },
  fail(message) {
    expect.unreachable(message);
  },
};

export {};
