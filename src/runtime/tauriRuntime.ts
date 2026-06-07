import type { HubEvent, HubEventSource, HubEventType } from "../types/hub";

export const TAURI_FIXTURE_COMMAND = "get_hub_event_fixtures";
export const TAURI_RUNTIME_CAPABILITIES_COMMAND = "get_runtime_capabilities";

export type TauriInvoke = (command: string, args?: Record<string, unknown>) => Promise<unknown>;

export type TauriRuntimeDiagnosticCode = "unavailable" | "invoke-failed" | "malformed";

export type TauriRuntimeDiagnostic = {
  code: TauriRuntimeDiagnosticCode;
  message: string;
  detail?: string;
};

export type TauriRuntimeResult =
  | {
      ok: true;
      events: HubEvent[];
    }
  | {
      ok: false;
      diagnostic: TauriRuntimeDiagnostic;
    };

export type TauriRuntimeCapabilities = {
  runtime: "tauri";
  fixtureIpc: true;
  tray: false;
  alwaysOnTop: false;
  windowsProviders: false;
  configuredShellWindow: TauriConfiguredShellWindow;
};

export type TauriConfiguredShellWindow = {
  configured: true;
  title: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  resizable: boolean;
  centered: boolean;
};

export type TauriRuntimeCapabilitiesResult =
  | {
      ok: true;
      capabilities: TauriRuntimeCapabilities;
    }
  | {
      ok: false;
      diagnostic: TauriRuntimeDiagnostic;
    };

export type HubEventPublisher = {
  publishHubEvent(event: HubEvent): void;
};

type TauriGlobal = {
  __TAURI__?: {
    core?: {
      invoke?: TauriInvoke;
    };
    invoke?: TauriInvoke;
  };
};

const eventTypes = new Set<HubEventType>(["music", "ai", "download", "notification"]);
const eventSources = new Set<HubEventSource>([
  "mock",
  "system",
  "music",
  "download",
  "ai",
  "notification",
]);

export function getTauriInvoke(globalScope: unknown = globalThis): TauriInvoke | undefined {
  const tauri = (globalScope as TauriGlobal | undefined)?.__TAURI__;
  const invoke = tauri?.core?.invoke ?? tauri?.invoke;

  return typeof invoke === "function" ? invoke : undefined;
}

export async function loadTauriFixtureHubEvents({
  invoke = getTauriInvoke(),
}: {
  invoke?: TauriInvoke;
} = {}): Promise<TauriRuntimeResult> {
  if (!invoke) {
    return {
      ok: false,
      diagnostic: {
        code: "unavailable",
        message: "Tauri runtime invoke is unavailable.",
      },
    };
  }

  try {
    const value = await invoke(TAURI_FIXTURE_COMMAND);
    const events = parseHubEvents(value);

    if (!events) {
      return {
        ok: false,
        diagnostic: {
          code: "malformed",
          message: "Tauri runtime returned malformed HubEvent fixtures.",
        },
      };
    }

    return {
      ok: true,
      events,
    };
  } catch (error) {
    return {
      ok: false,
      diagnostic: {
        code: "invoke-failed",
        message: "Tauri runtime fixture command failed.",
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export async function publishTauriFixtureEvents(
  eventBus: HubEventPublisher,
  options: {
    invoke?: TauriInvoke;
  } = {},
): Promise<TauriRuntimeResult> {
  const result = await loadTauriFixtureHubEvents(options);

  if (!result.ok) {
    return result;
  }

  result.events.forEach((event) => eventBus.publishHubEvent(event));

  return result;
}

export async function loadTauriRuntimeCapabilities({
  invoke = getTauriInvoke(),
}: {
  invoke?: TauriInvoke;
} = {}): Promise<TauriRuntimeCapabilitiesResult> {
  if (!invoke) {
    return {
      ok: false,
      diagnostic: {
        code: "unavailable",
        message: "Tauri runtime invoke is unavailable.",
      },
    };
  }

  try {
    const value = await invoke(TAURI_RUNTIME_CAPABILITIES_COMMAND);
    const capabilities = parseRuntimeCapabilities(value);

    if (!capabilities) {
      return {
        ok: false,
        diagnostic: {
          code: "malformed",
          message: "Tauri runtime returned malformed capability facts.",
        },
      };
    }

    return {
      ok: true,
      capabilities,
    };
  } catch (error) {
    return {
      ok: false,
      diagnostic: {
        code: "invoke-failed",
        message: "Tauri runtime capability command failed.",
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

function parseHubEvents(value: unknown): HubEvent[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const events = value.filter(isHubEvent);

  return events.length === value.length ? events : undefined;
}

function parseRuntimeCapabilities(value: unknown): TauriRuntimeCapabilities | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (
    value.runtime !== "tauri" ||
    value.fixtureIpc !== true ||
    value.tray !== false ||
    value.alwaysOnTop !== false ||
    value.windowsProviders !== false ||
    !isConfiguredShellWindow(value.configuredShellWindow)
  ) {
    return undefined;
  }

  return {
    runtime: value.runtime,
    fixtureIpc: value.fixtureIpc,
    tray: value.tray,
    alwaysOnTop: value.alwaysOnTop,
    windowsProviders: value.windowsProviders,
    configuredShellWindow: value.configuredShellWindow,
  };
}

function isConfiguredShellWindow(value: unknown): value is TauriConfiguredShellWindow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.configured === true &&
    typeof value.title === "string" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.minWidth === "number" &&
    typeof value.minHeight === "number" &&
    typeof value.resizable === "boolean" &&
    typeof value.centered === "boolean"
  );
}

function isHubEvent(value: unknown): value is HubEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    eventTypes.has(value.type as HubEventType) &&
    eventSources.has(value.source as HubEventSource) &&
    typeof value.createdAt === "number" &&
    isOptionalNumber(value.expiresAt) &&
    isOptionalNumber(value.progress) &&
    isOptionalRecord(value.payload) &&
    isOptionalRecord(value.metadata)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalRecord(value: unknown): boolean {
  return value === undefined || isRecord(value);
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || typeof value === "number";
}
