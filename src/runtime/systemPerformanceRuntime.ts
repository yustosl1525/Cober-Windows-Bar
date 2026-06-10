import { systemPerformanceMetrics } from "../data/mockHubData";
import type { SystemPerformanceMetric } from "../types/hub";
import { getTauriInvoke, type TauriInvoke } from "./tauriRuntime";

export const TAURI_SYSTEM_PERFORMANCE_COMMAND = "get_system_performance";
const DEFAULT_SYSTEM_STATUS_PREFLIGHT_TIMEOUT_MS = 1500;

const SYSTEM_PERFORMANCE_LABELS = {
  cpu: "CPU",
  memory: "\u5185\u5B58",
  network: "\u7F51\u7EDC",
} as const;

export type SystemPerformanceSnapshot = {
  cpu: number;
  memory: number;
  network: number;
};

export type SystemStatusDiagnosticQuality = "live" | "fallback" | "stale" | "unavailable";
export type SystemStatusDiagnosticCode =
  | "unsupported"
  | "unavailable"
  | "permission-denied"
  | "malformed"
  | "timeout"
  | "invoke-failed";
export type SystemStatusDiagnosticSource = "mock" | "tauri-fixture" | "tauri-event" | "preflight";

export type SystemStatusDiagnostic = {
  quality: SystemStatusDiagnosticQuality;
  code: SystemStatusDiagnosticCode;
  source: SystemStatusDiagnosticSource;
  lastSuccessfulSource?: SystemStatusDiagnosticSource;
};

export type SystemPerformanceStatusResult = {
  metrics: SystemPerformanceMetric[];
  diagnostic: SystemStatusDiagnostic;
};

export async function loadSystemPerformance({
  invoke = getTauriInvoke(),
}: {
  invoke?: TauriInvoke;
} = {}): Promise<SystemPerformanceMetric[]> {
  const result = await loadSystemPerformanceStatus({ invoke });
  return result.metrics;
}

export async function loadSystemPerformanceStatus({
  invoke = getTauriInvoke(),
  fallbackMetrics = systemPerformanceMetrics,
  lastSuccessfulSource,
  timeoutMs = DEFAULT_SYSTEM_STATUS_PREFLIGHT_TIMEOUT_MS,
}: {
  invoke?: TauriInvoke;
  fallbackMetrics?: SystemPerformanceMetric[];
  lastSuccessfulSource?: SystemStatusDiagnosticSource;
  timeoutMs?: number;
} = {}): Promise<SystemPerformanceStatusResult> {
  if (!invoke) {
    return createDiagnosticResult({
      code: "unavailable",
      fallbackMetrics,
      lastSuccessfulSource,
    });
  }

  try {
    const value = await invokeWithTimeout(invoke, TAURI_SYSTEM_PERFORMANCE_COMMAND, timeoutMs);
    const parsed = parseSystemPerformancePreflightPayload(value);

    if (!parsed) {
      return createDiagnosticResult({
        code: "malformed",
        fallbackMetrics,
        lastSuccessfulSource,
      });
    }

    return {
      metrics: createSystemPerformanceMetrics(parsed.snapshot),
      diagnostic: parsed.diagnostic,
    };
  } catch (error) {
    return createDiagnosticResult({
      code: classifySystemStatusInvokeError(error),
      fallbackMetrics,
      lastSuccessfulSource,
    });
  }
}

export function createSystemPerformanceMetrics(
  snapshot: SystemPerformanceSnapshot,
): SystemPerformanceMetric[] {
  return [
    { id: "cpu", label: SYSTEM_PERFORMANCE_LABELS.cpu, value: snapshot.cpu, tone: "blue" },
    { id: "memory", label: SYSTEM_PERFORMANCE_LABELS.memory, value: snapshot.memory, tone: "violet" },
    { id: "network", label: SYSTEM_PERFORMANCE_LABELS.network, value: snapshot.network, tone: "cyan" },
  ];
}

export function normalizeSystemStatusDiagnostic(value: unknown): SystemStatusDiagnostic | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (!isSystemStatusDiagnosticQuality(value.quality)) {
    return undefined;
  }

  if (!isSystemStatusDiagnosticSource(value.source)) {
    return undefined;
  }

  const code = value.code === undefined ? "unavailable" : value.code;
  if (!isSystemStatusDiagnosticCode(code)) {
    return undefined;
  }

  const diagnostic: SystemStatusDiagnostic = {
    quality: value.quality,
    code,
    source: value.source,
  };

  if (value.lastSuccessfulSource !== undefined) {
    if (!isSystemStatusDiagnosticSource(value.lastSuccessfulSource)) {
      return undefined;
    }
    diagnostic.lastSuccessfulSource = value.lastSuccessfulSource;
  }

  return diagnostic;
}

function parseSystemPerformancePreflightPayload(
  value: unknown,
): { snapshot: SystemPerformanceSnapshot; diagnostic: SystemStatusDiagnostic } | undefined {
  const directSnapshot = parseSystemPerformanceSnapshot(value);
  if (directSnapshot) {
    return {
      snapshot: directSnapshot,
      diagnostic: {
        quality: "fallback",
        code: "unavailable",
        source: "tauri-fixture",
      },
    };
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const snapshot = parseSystemPerformanceSnapshot(value.snapshot);
  const diagnostic = normalizeSystemStatusDiagnostic(value.diagnostic);

  if (!snapshot || !diagnostic) {
    return undefined;
  }

  return { snapshot, diagnostic };
}

function parseSystemPerformanceSnapshot(value: unknown): SystemPerformanceSnapshot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const cpu = toPercent(value.cpu);
  const memory = toPercent(value.memory);
  const network = toPercent(value.network);

  if (cpu === undefined || memory === undefined || network === undefined) {
    return undefined;
  }

  return { cpu, memory, network };
}

function createDiagnosticResult({
  code,
  fallbackMetrics,
  lastSuccessfulSource,
}: {
  code: SystemStatusDiagnosticCode;
  fallbackMetrics: SystemPerformanceMetric[];
  lastSuccessfulSource?: SystemStatusDiagnosticSource;
}): SystemPerformanceStatusResult {
  const safeLastSuccessfulSource = lastSuccessfulSource === "mock" ? undefined : lastSuccessfulSource;

  return {
    metrics: snapshotSystemPerformanceMetrics(fallbackMetrics),
    diagnostic: safeLastSuccessfulSource
      ? {
          quality: "stale",
          code,
          source: "preflight",
          lastSuccessfulSource: safeLastSuccessfulSource,
        }
      : {
          quality: "unavailable",
          code,
          source: "preflight",
        },
  };
}

async function invokeWithTimeout(
  invoke: TauriInvoke,
  command: string,
  timeoutMs: number,
): Promise<unknown> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return invoke(command);
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new SystemStatusTimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([invoke(command), timeout]);
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }
}

class SystemStatusTimeoutError extends Error {
  constructor() {
    super("System status preflight timed out.");
  }
}

function classifySystemStatusInvokeError(error: unknown): SystemStatusDiagnosticCode {
  if (error instanceof SystemStatusTimeoutError) {
    return "timeout";
  }

  if (isRecord(error) && typeof error.code === "string" && isSystemStatusDiagnosticCode(error.code)) {
    return error.code;
  }

  return "invoke-failed";
}

function isSystemStatusDiagnosticQuality(value: unknown): value is SystemStatusDiagnosticQuality {
  return value === "live" || value === "fallback" || value === "stale" || value === "unavailable";
}

function isSystemStatusDiagnosticCode(value: unknown): value is SystemStatusDiagnosticCode {
  return (
    value === "unsupported" ||
    value === "unavailable" ||
    value === "permission-denied" ||
    value === "malformed" ||
    value === "timeout" ||
    value === "invoke-failed"
  );
}

function isSystemStatusDiagnosticSource(value: unknown): value is SystemStatusDiagnosticSource {
  return value === "mock" || value === "tauri-fixture" || value === "tauri-event" || value === "preflight";
}

function toPercent(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function snapshotSystemPerformanceMetrics(metrics: SystemPerformanceMetric[]): SystemPerformanceMetric[] {
  return metrics.map((metric) => ({ ...metric }));
}
