import { strict as assert } from "node:assert";
import {
  loadSystemPerformance,
  loadSystemPerformanceStatus,
  normalizeSystemStatusDiagnostic,
} from "./systemPerformanceRuntime";
import type { SystemPerformanceMetric } from "../types/hub";

const tests: Array<{ name: string; run: () => void | Promise<void> }> = [];

function test(name: string, run: () => void | Promise<void>) {
  tests.push({ name, run });
}

test("keeps readable Chinese labels when native system data loads", async () => {
  const metrics = await loadSystemPerformance({
    invoke: async () => ({
      cpu: 17,
      memory: 61,
      network: 42,
    }),
  });

  assert.deepEqual(
    metrics.map((metric) => ({ id: metric.id, label: metric.label, value: metric.value })),
    [
      { id: "cpu", label: "CPU", value: 17 },
      { id: "memory", label: "内存", value: 61 },
      { id: "network", label: "网络", value: 42 },
    ],
  );
});

test("falls back without introducing mojibake when native data is malformed", async () => {
  const metrics = await loadSystemPerformance({
    invoke: async () => ({
      cpu: "bad",
      memory: 61,
      network: 42,
    }),
  });

  for (const label of metrics.map((metric) => metric.label)) {
    assert.equal(/\uFFFD/.test(label), false, `${label} must not be mojibake`);
  }
});

test("Tauri capability unavailable returns unavailable diagnostic", async () => {
  const result = await loadSystemPerformanceStatus();

  assert.deepEqual(result.diagnostic, {
    quality: "unavailable",
    code: "unavailable",
    source: "preflight",
  });
  assert.equal(result.metrics.length, 3);
});

test("unsupported platform returns unavailable unsupported diagnostic", async () => {
  const result = await loadSystemPerformanceStatus({
    invoke: async () => {
      throw { code: "unsupported" };
    },
  });

  assert.deepEqual(result.diagnostic, {
    quality: "unavailable",
    code: "unsupported",
    source: "preflight",
  });
});

test("permission denied returns safe permission diagnostic without private detail", async () => {
  const result = await loadSystemPerformanceStatus({
    invoke: async () => {
      throw {
        code: "permission-denied",
        path: "C:\\Users\\private",
        commandOutput: "secret output",
      };
    },
  });

  assert.deepEqual(result.diagnostic, {
    quality: "unavailable",
    code: "permission-denied",
    source: "preflight",
  });
  assert.equal("path" in result.diagnostic, false);
  assert.equal("commandOutput" in result.diagnostic, false);
});

test("malformed native payload returns unavailable malformed without contaminating safe metrics", async () => {
  const fallbackMetrics: SystemPerformanceMetric[] = [
    { id: "cpu", label: "CPU", value: 11, tone: "blue" },
    { id: "memory", label: "Memory", value: 22, tone: "violet" },
    { id: "network", label: "Network", value: 33, tone: "cyan" },
  ];
  const result = await loadSystemPerformanceStatus({
    fallbackMetrics,
    invoke: async () => ({
      snapshot: {
        cpu: 92,
        memory: "bad",
        network: 41,
      },
      diagnostic: {
        quality: "live",
        code: "unavailable",
        source: "preflight",
      },
    }),
  });

  assert.deepEqual(result.diagnostic, {
    quality: "unavailable",
    code: "malformed",
    source: "preflight",
  });
  assert.deepEqual(
    result.metrics.map((metric) => metric.value),
    [11, 22, 33],
  );
});

test("timeout returns unavailable timeout diagnostic", async () => {
  const result = await loadSystemPerformanceStatus({
    timeoutMs: 1,
    invoke: async () => new Promise(() => undefined),
  });

  assert.deepEqual(result.diagnostic, {
    quality: "unavailable",
    code: "timeout",
    source: "preflight",
  });
});

test("rejected invoke maps provider bug to invoke-failed diagnostic", async () => {
  const result = await loadSystemPerformanceStatus({
    invoke: async () => {
      throw new Error("C:\\Users\\private\\provider failed");
    },
  });

  assert.deepEqual(result.diagnostic, {
    quality: "unavailable",
    code: "invoke-failed",
    source: "preflight",
  });
  assert.equal("detail" in result.diagnostic, false);
});

test("last known safe data is surfaced only as stale with last successful source", async () => {
  const result = await loadSystemPerformanceStatus({
    lastSuccessfulSource: "tauri-fixture",
    invoke: async () => {
      throw { code: "timeout" };
    },
  });

  assert.deepEqual(result.diagnostic, {
    quality: "stale",
    code: "timeout",
    source: "preflight",
    lastSuccessfulSource: "tauri-fixture",
  });
});

test("legacy native metrics are treated as fixture fallback rather than real live provider", async () => {
  const result = await loadSystemPerformanceStatus({
    invoke: async () => ({
      cpu: 17,
      memory: 61,
      network: 42,
    }),
  });

  assert.deepEqual(result.diagnostic, {
    quality: "fallback",
    code: "unavailable",
    source: "tauri-fixture",
  });
});

test("explicit preflight envelope can carry future live quality without raw payload fields", async () => {
  const result = await loadSystemPerformanceStatus({
    invoke: async () => ({
      snapshot: {
        cpu: 17,
        memory: 61,
        network: 42,
      },
      diagnostic: {
        quality: "live",
        source: "preflight",
      },
      rawSourcePayload: {
        path: "C:\\Users\\private",
      },
    }),
  });

  assert.deepEqual(result.diagnostic, {
    quality: "live",
    code: "unavailable",
    source: "preflight",
  });
  assert.equal("rawSourcePayload" in result.diagnostic, false);
});

test("normalizes only approved diagnostic fields and values", () => {
  assert.equal(
    normalizeSystemStatusDiagnostic({
      quality: "live",
      code: "provider-bug",
      source: "preflight",
    }),
    undefined,
  );
  assert.deepEqual(
    normalizeSystemStatusDiagnostic({
      quality: "stale",
      code: "malformed",
      source: "preflight",
      lastSuccessfulSource: "tauri-event",
      path: "C:\\Users\\private",
    }),
    {
      quality: "stale",
      code: "malformed",
      source: "preflight",
      lastSuccessfulSource: "tauri-event",
    },
  );
});

test("rejects last successful source unless diagnostic quality explains fallback or stale state", async () => {
  for (const quality of ["live", "unavailable"] as const) {
    assert.equal(
      normalizeSystemStatusDiagnostic({
        quality,
        code: "unavailable",
        source: "preflight",
        lastSuccessfulSource: "tauri-event",
      }),
      undefined,
    );
  }

  for (const quality of ["fallback", "stale"] as const) {
    assert.deepEqual(
      normalizeSystemStatusDiagnostic({
        quality,
        code: "timeout",
        source: "preflight",
        lastSuccessfulSource: "tauri-event",
      }),
      {
        quality,
        code: "timeout",
        source: "preflight",
        lastSuccessfulSource: "tauri-event",
      },
    );
  }

  const fallbackMetrics: SystemPerformanceMetric[] = [
    { id: "cpu", label: "CPU", value: 11, tone: "blue" },
    { id: "memory", label: "Memory", value: 22, tone: "violet" },
    { id: "network", label: "Network", value: 33, tone: "cyan" },
  ];

  const result = await loadSystemPerformanceStatus({
    fallbackMetrics,
    invoke: async () => ({
      snapshot: {
        cpu: 17,
        memory: 61,
        network: 42,
      },
      diagnostic: {
        quality: "live",
        code: "unavailable",
        source: "preflight",
        lastSuccessfulSource: "tauri-event",
      },
    }),
  });

  assert.deepEqual(result.diagnostic, {
    quality: "unavailable",
    code: "malformed",
    source: "preflight",
  });
  assert.deepEqual(
    result.metrics.map((metric) => metric.value),
    [11, 22, 33],
  );
});

for (const { name, run } of tests) {
  try {
    await run();
    console.log(`ok ${name}`);
  } catch (error) {
    console.error(`not ok ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}
