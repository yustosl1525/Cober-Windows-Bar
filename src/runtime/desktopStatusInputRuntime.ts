import { mockHubEvents } from "../data/mockHubData";
import { createHubEventBus, type HubEventBus } from "../state/hubState";
import type { HubEvent, HubStoreState } from "../types/hub";
import {
  getTauriInvoke,
  loadTauriFixtureHubEvents,
  type TauriInvoke,
  type TauriRuntimeDiagnostic,
} from "./tauriRuntime";
import type { Event, UnlistenFn } from "@tauri-apps/api/event";
import { listen } from "@tauri-apps/api/event";

export const DESKTOP_STATUS_INPUT_EVENT = "status-center://hub-events";

export type DesktopStatusEventSource = "mock" | "tauri-fixture" | "tauri-event";

export type DesktopStatusEventsResult = {
  events: HubEvent[];
  source: DesktopStatusEventSource;
  diagnostic?: TauriRuntimeDiagnostic;
};

export type DesktopStatusRuntimeSnapshot = {
  state: HubStoreState;
  source: DesktopStatusEventSource;
  diagnostic?: TauriRuntimeDiagnostic;
};

export type DesktopStatusRuntime = {
  getSnapshot(now?: number): DesktopStatusRuntimeSnapshot;
  refresh(): Promise<DesktopStatusRuntimeSnapshot>;
  subscribe(subscriber: (snapshot: DesktopStatusRuntimeSnapshot) => void): () => void;
  dispose(): void;
};

export type DesktopStatusEventListener = (
  events: HubEvent[],
  source?: DesktopStatusEventSource,
  diagnostic?: TauriRuntimeDiagnostic,
) => void;

export type DesktopStatusEventListenerUnsubscribe = () => void;

export type DesktopStatusEventListenerSource = (
  listener: DesktopStatusEventListener,
) => DesktopStatusEventListenerUnsubscribe | Promise<DesktopStatusEventListenerUnsubscribe>;

export type DesktopStatusTauriListen = (
  event: string,
  handler: (event: Event<unknown>) => void | Promise<void>,
) => Promise<UnlistenFn>;

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof value === "object" && value !== null && "then" in value && typeof value.then === "function";
}

type CreateDesktopStatusRuntimeOptions = {
  invoke?: TauriInvoke;
  fallbackEvents?: HubEvent[];
  eventBus?: HubEventBus;
  subscribeToEvents?: DesktopStatusEventListenerSource;
  tauriListen?: DesktopStatusTauriListen;
};

const desktopStatusRuntimeCache = new WeakMap<TauriInvoke | typeof globalThis, DesktopStatusRuntime>();

export async function loadDesktopStatusEvents({
  invoke = getTauriInvoke(),
  fallbackEvents = mockHubEvents,
}: {
  invoke?: TauriInvoke;
  fallbackEvents?: HubEvent[];
} = {}): Promise<DesktopStatusEventsResult> {
  if (!invoke) {
    return {
      events: snapshotHubEvents(fallbackEvents),
      source: "mock",
    };
  }

  const result = await loadTauriFixtureHubEvents({ invoke });

  if (!result.ok) {
    return {
      events: snapshotHubEvents(fallbackEvents),
      source: "mock",
      diagnostic: result.diagnostic,
    };
  }

  return {
    events: snapshotHubEvents(result.events),
    source: "tauri-fixture",
  };
}

export function createDesktopStatusRuntime({
  invoke = getTauriInvoke(),
  fallbackEvents = mockHubEvents,
  eventBus = createHubEventBus(),
  subscribeToEvents,
  tauriListen,
}: CreateDesktopStatusRuntimeOptions = {}): DesktopStatusRuntime {
  let source: DesktopStatusEventSource = "mock";
  let diagnostic: TauriRuntimeDiagnostic | undefined;
  let disposed = false;
  const snapshotFallbackEvents = snapshotHubEvents(fallbackEvents);
  const runtimeSubscribers = new Set<(snapshot: DesktopStatusRuntimeSnapshot) => void>();
  let unsubscribeBus: (() => void) | undefined;
  let unsubscribePushSource: (() => void) | undefined;
  const eventSourceSubscription =
    subscribeToEvents ?? (invoke ? createTauriDesktopStatusEventSource({ tauriListen }) : undefined);

  eventBus.replaceHubEvents(snapshotFallbackEvents);

  function snapshot(now?: number): DesktopStatusRuntimeSnapshot {
    return {
      state: eventBus.getState(now),
      source,
      diagnostic,
    };
  }

  function deliver(subscriber: (value: DesktopStatusRuntimeSnapshot) => void, value: DesktopStatusRuntimeSnapshot) {
    try {
      subscriber(value);
    } catch {
      // Desktop runtime subscriber failures should not block unrelated listeners.
    }
  }

  function notify() {
    const nextSnapshot = snapshot();
    runtimeSubscribers.forEach((subscriber) => deliver(subscriber, nextSnapshot));
  }

  unsubscribeBus = eventBus.subscribe(() => {
    if (disposed) {
      return;
    }

    notify();
  });

  if (eventSourceSubscription) {
    const subscription = eventSourceSubscription((events, nextSource = "tauri-fixture", nextDiagnostic) => {
      if (disposed) {
        return;
      }

      source = nextSource;
      diagnostic = nextDiagnostic;
      eventBus.replaceHubEvents(snapshotHubEvents(events));
    });

    if (isPromiseLike(subscription)) {
      void subscription.then((unsubscribe) => {
        if (disposed) {
          unsubscribe();
          return;
        }

        unsubscribePushSource = unsubscribe;
      });
    } else {
      unsubscribePushSource = subscription;
    }
  }

  async function refresh() {
    const result = await loadDesktopStatusEvents({ invoke, fallbackEvents: snapshotFallbackEvents });

    if (disposed) {
      return snapshot();
    }

    source = result.source;
    diagnostic = result.diagnostic;
    eventBus.replaceHubEvents(result.events);

    return snapshot();
  }

  return {
    getSnapshot(now) {
      return snapshot(now);
    },
    refresh,
    subscribe(subscriber) {
      runtimeSubscribers.add(subscriber);
      deliver(subscriber, snapshot());

      return () => {
        runtimeSubscribers.delete(subscriber);
      };
    },
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      runtimeSubscribers.clear();
      unsubscribeBus?.();
      unsubscribeBus = undefined;
      unsubscribePushSource?.();
      unsubscribePushSource = undefined;
    },
  };
}

export function createTauriDesktopStatusEventSource({
  tauriListen = listen,
}: {
  tauriListen?: DesktopStatusTauriListen;
} = {}): DesktopStatusEventListenerSource {
  return async (listener) => {
    try {
      return await tauriListen(DESKTOP_STATUS_INPUT_EVENT, async (event) => {
        const result = parseDesktopStatusInputEventPayload(event.payload);
        if (!result) {
          return;
        }

        listener(result.events, "tauri-event");
      });
    } catch {
      return () => {
        // Keep refresh/fallback flows available when the Tauri event bridge is absent.
      };
    }
  };
}

export function getDesktopStatusRuntime(options: CreateDesktopStatusRuntimeOptions = {}): DesktopStatusRuntime {
  if (options.eventBus || options.fallbackEvents || options.invoke) {
    return createDesktopStatusRuntime(options);
  }

  const key = getTauriInvoke() ?? globalThis;
  const cached = desktopStatusRuntimeCache.get(key);

  if (cached) {
    return cached;
  }

  const runtime = createDesktopStatusRuntime();
  desktopStatusRuntimeCache.set(key, runtime);
  return runtime;
}

function snapshotHubEvents(events: HubEvent[]): HubEvent[] {
  return events.map((event) => ({
    ...event,
    payload: event.payload ? { ...event.payload } : undefined,
    metadata: event.metadata ? { ...event.metadata } : undefined,
  }));
}

function parseDesktopStatusInputEventPayload(
  value: unknown,
): { events: HubEvent[] } | undefined {
  const events = Array.isArray(value)
    ? parseHubEvents(value)
    : isRecord(value) && Array.isArray(value.events)
      ? parseHubEvents(value.events)
      : undefined;

  return events ? { events } : undefined;
}

function parseHubEvents(value: unknown[]): HubEvent[] | undefined {
  const events = value.filter(isHubEvent);
  return events.length === value.length ? snapshotHubEvents(events) : undefined;
}

function isHubEvent(value: unknown): value is HubEvent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isHubEventType(value.type) &&
    isHubEventSource(value.source) &&
    isFiniteNumber(value.createdAt) &&
    isOptionalNumber(value.expiresAt) &&
    isOptionalNumber(value.progress) &&
    isOptionalRecord(value.payload) &&
    isOptionalRecord(value.metadata)
  );
}

function isHubEventType(value: unknown): value is HubEvent["type"] {
  return value === "music" || value === "ai" || value === "download" || value === "notification";
}

function isHubEventSource(value: unknown): value is HubEvent["source"] {
  return (
    value === "mock" ||
    value === "system" ||
    value === "music" ||
    value === "download" ||
    value === "ai" ||
    value === "notification"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalRecord(value: unknown): boolean {
  return value === undefined || isRecord(value);
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || isFiniteNumber(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
