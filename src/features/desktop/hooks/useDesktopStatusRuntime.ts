import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getDesktopStatusRuntime,
  type DesktopStatusRuntime,
  type DesktopStatusRuntimeSnapshot,
} from "../../../runtime/desktopStatusInputRuntime";
import { aggregateDesktopStatusInput } from "../../../state/desktopStatusAggregation";
import { resolveDesktopStatusState } from "../../../state/desktopStatusState";
import { DESKTOP_STATUS_PREFERRED_WINDOW_MS } from "../../../state/desktopStatusScheduler";
import type {
  DesktopStatusKind,
  DesktopStatusState,
  HubEvent,
  HubStoreState,
  SystemPerformanceMetric,
  SystemPerformancePayload,
} from "../../../types/hub";
import { DESKTOP_STATUS_TEMPLATE_ORDER } from "../../../data/desktopStatusConfig";
import { createHubEventBus } from "../../../state/hubState";
import { createProviderManager, type ProviderManager } from "../../../providers/providerManager";
import { onMediaSessionChanged, type MediaSessionChangedPayload } from "../../../runtime/systemMonitorRuntime";
import { MEDIA_DISPLAY_WINDOW_MS, formatMediaTime } from "../../../shared/mediaTime";

export type UseDesktopStatusRuntimeResult = {
  resolvedState: DesktopStatusState;
  activeKinds: DesktopStatusKind[];
  activeStatusKind: DesktopStatusKind | null;
  preferredUntil: number | undefined;
  setActiveStatusKind: (kind: DesktopStatusKind | null) => void;
  setPreferredUntil: (until: number | undefined) => void;
  refreshRuntime: () => Promise<void>;
  preferredWindowMs: number;
};

function applyDesktopStatusSnapshot(
  snapshot: DesktopStatusRuntimeSnapshot,
  setter: (updater: (prev: HubStoreState) => HubStoreState) => void,
) {
  setter((prev) => ({
    ...snapshot.state,
    clipboard: prev.clipboard ?? snapshot.state.clipboard,
    focus: prev.focus ?? snapshot.state.focus,
    systemPerformance: prev.systemPerformance ?? snapshot.state.systemPerformance,
    events: [
      ...prev.events.filter((e) => e.type === "media"),
      ...(snapshot.state.events ?? []),
    ],
  }));
}

/**
 * Convert SystemPerformancePayload from the bus back into SystemPerformanceMetric[]
 * for the resident status template.
 */
function systemPayloadToMetrics(payload: SystemPerformancePayload): SystemPerformanceMetric[] {
  return [
    { id: "cpu", label: "CPU", value: payload.cpu, tone: "blue" },
    { id: "memory", label: "\u5185\u5B58", value: payload.memory, tone: "violet" },
    { id: "download", label: "\u4E0B\u8F7D", value: payload.downloadSpeed, tone: "cyan" },
    { id: "upload", label: "\u4E0A\u4F20", value: payload.uploadSpeed, tone: "emerald" },
  ];
}

function mediaPayloadToHubEvent(payload: MediaSessionChangedPayload): HubEvent {
  const createdAt = payload.checkedAt || Date.now();
  const expiresAt = payload.playbackStatus === "playing"
    ? createdAt + MEDIA_DISPLAY_WINDOW_MS
    : createdAt;

  return {
    id: `direct-media-${createdAt}`,
    type: "media",
    source: "media",
    createdAt,
    expiresAt,
    progress: payload.progress,
    payload: {
      available: payload.available,
      playbackStatus: payload.playbackStatus,
      progress: payload.progress,
      positionMs: payload.positionMs,
      durationMs: payload.durationMs,
    },
    metadata: {
      timeLabel: formatMediaTime(payload.positionMs, payload.durationMs),
      code: payload.code,
    },
  };
}

export function useDesktopStatusRuntime(
  metrics: SystemPerformanceMetric[],
  systemPerformanceSourceQuality: string,
): UseDesktopStatusRuntimeResult {
  const runtimeRef = useRef<DesktopStatusRuntime>(getDesktopStatusRuntime());
  const initialSnapshot = runtimeRef.current.getSnapshot();

  // Create a shared HubEventBus and ProviderManager for the unified pipeline.
  const busRef = useRef(createHubEventBus());
  const managerRef = useRef<ProviderManager | undefined>(undefined);

  // Initialize the ProviderManager on first render
  if (!managerRef.current) {
    managerRef.current = createProviderManager(busRef.current, {
      realProviders: true,
      mockProviders: true,
    });
  }

  const [hubState, setHubState] = useState<HubStoreState>(initialSnapshot.state);
  const [activeStatusKind, setActiveStatusKind] = useState<DesktopStatusKind | null>(null);
  const [preferredUntil, setPreferredUntil] = useState<number | undefined>(undefined);

  const previousResolvedKindRef = useRef<DesktopStatusKind | undefined>(undefined);
  const previousResolvedChangedAtRef = useRef<number | undefined>(undefined);
  const activatedAtByKindRef = useRef<Partial<Record<DesktopStatusKind, number>>>({});

  // Subscribe to runtime changes + initial refresh (legacy pipeline for hub events)
  useEffect(() => {
    const runtime = runtimeRef.current;
    const unsubscribe = runtime.subscribe((snapshot) => {
      applyDesktopStatusSnapshot(snapshot, setHubState);
    });

    void runtime.refresh().then((snapshot) => {
      applyDesktopStatusSnapshot(snapshot, setHubState);
    });

    return unsubscribe;
  }, []);

  // Direct Tauri media session listener — the canonical media event path.
  // The Provider pipeline's media events are not consumed by the bus subscriber,
  // so this direct listener is the single source of truth for media events.
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    onMediaSessionChanged((payload) => {
      const mediaEvent = mediaPayloadToHubEvent(payload);
      setHubState((prev) => ({
        ...prev,
        events: [mediaEvent, ...prev.events.filter((e) => e.id !== mediaEvent.id)],
      }));
    }).then((fn) => {
      unlisten = fn;
    }).catch(() => {
      // Media session listener not available — non-critical
    });

    return () => {
      unlisten?.();
    };
  }, []);

  // Start the unified ProviderManager for clipboard, focus, and system perf.
  useEffect(() => {
    const manager = managerRef.current;
    const bus = busRef.current;

    const unsubscribeBus = bus.subscribe((busState) => {
      setHubState((prev) => ({
        ...prev,
        clipboard: busState.clipboard ?? prev.clipboard,
        focus: busState.focus ?? prev.focus,
        systemPerformance: busState.systemPerformance ?? prev.systemPerformance,
      }));
    });

    manager?.start();

    return () => {
      manager?.stop();
      unsubscribeBus();
    };
  }, []);

  // Aggregation (memoized to avoid recomputing on every render)
  const aggregatedStatus = useMemo(
    () => aggregateDesktopStatusInput({
      hubState,
      availableKinds: DESKTOP_STATUS_TEMPLATE_ORDER,
    }),
    [hubState],
  );

  // Extract system performance metrics from the unified pipeline
  const busMetrics = useMemo(
    () => hubState.systemPerformance ? systemPayloadToMetrics(hubState.systemPerformance) : undefined,
    [hubState.systemPerformance],
  );
  const effectiveMetrics = busMetrics ?? metrics;
  const effectiveQuality = hubState.systemPerformance?.quality ?? systemPerformanceSourceQuality;

  const now = Date.now();

  // Track activation timestamps for each active kind
  for (const kind of aggregatedStatus.activeKinds) {
    if (activatedAtByKindRef.current[kind] === undefined) {
      activatedAtByKindRef.current[kind] = now;
    }
  }

  for (const kind of Object.keys(activatedAtByKindRef.current) as DesktopStatusKind[]) {
    if (!aggregatedStatus.activeKinds.includes(kind)) {
      delete activatedAtByKindRef.current[kind];
    }
  }

  const resolvedState = resolveDesktopStatusState({
    metrics: effectiveMetrics,
    systemPerformanceSourceStatus: { quality: effectiveQuality as "live" | "fallback" | "stale" | "unavailable" },
    activeKinds: aggregatedStatus.activeKinds,
    availableKinds: aggregatedStatus.availableKinds,
    states: aggregatedStatus.states,
    preferredKind: activeStatusKind ?? undefined,
    preferredUntil,
    previousKind: previousResolvedKindRef.current,
    previousChangedAt: previousResolvedChangedAtRef.current,
    activatedAtByKind: activatedAtByKindRef.current,
    now,
  });

  // Track previous resolved kind for scheduler stability
  if (previousResolvedKindRef.current !== resolvedState.kind) {
    previousResolvedKindRef.current = resolvedState.kind;
    previousResolvedChangedAtRef.current = now;
  }

  const refreshRuntime = useCallback(async () => {
    const snapshot = await runtimeRef.current.refresh();
    applyDesktopStatusSnapshot(snapshot, setHubState);
  }, []);

  return {
    resolvedState,
    activeKinds: aggregatedStatus.activeKinds,
    activeStatusKind,
    preferredUntil,
    setActiveStatusKind,
    setPreferredUntil,
    refreshRuntime,
    preferredWindowMs: DESKTOP_STATUS_PREFERRED_WINDOW_MS,
  };
}
