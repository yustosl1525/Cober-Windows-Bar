import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDesktopStatusRuntime,
  type DesktopStatusRuntime,
  type DesktopStatusRuntimeSnapshot,
} from "../../../runtime/desktopStatusInputRuntime";
import { aggregateDesktopStatusInput } from "../../../state/desktopStatusAggregation";
import { createDesktopStatusStateMap, resolveDesktopStatusState } from "../../../state/desktopStatusState";
import { DESKTOP_STATUS_PREFERRED_WINDOW_MS } from "../../../state/desktopStatusScheduler";
import type {
  DesktopStatusKind,
  DesktopStatusState,
  DesktopStatusStateMap,
  HubStoreState,
  SystemPerformanceMetric,
} from "../../../types/hub";
import { DESKTOP_STATUS_TEMPLATE_ORDER } from "../../../data/desktopStatusConfig";

export type UseDesktopStatusRuntimeResult = {
  hubState: HubStoreState;
  resolvedState: DesktopStatusState;
  resolvedStates: Partial<DesktopStatusStateMap>;
  activeKinds: DesktopStatusKind[];
  activeStatusKind: DesktopStatusKind | null;
  preferredUntil: number | undefined;
  setActiveStatusKind: (kind: DesktopStatusKind | null) => void;
  setPreferredUntil: (until: number | undefined) => void;
  refreshRuntime: () => Promise<void>;
  preferredWindowMs: number;
};

export type SystemMonitorOverrides = {
  externalActiveKinds?: DesktopStatusKind[];
  externalStates?: Partial<DesktopStatusStateMap>;
};

function applyDesktopStatusSnapshot(
  snapshot: DesktopStatusRuntimeSnapshot,
  setter: (state: HubStoreState) => void,
) {
  setter(snapshot.state);
}

export function useDesktopStatusRuntime(
  metrics: SystemPerformanceMetric[],
  systemPerformanceSourceQuality: string,
  systemMonitors?: SystemMonitorOverrides,
): UseDesktopStatusRuntimeResult {
  const runtimeRef = useRef<DesktopStatusRuntime>(getDesktopStatusRuntime());
  const initialSnapshot = runtimeRef.current.getSnapshot();

  const [hubState, setHubState] = useState<HubStoreState>(initialSnapshot.state);
  const [activeStatusKind, setActiveStatusKind] = useState<DesktopStatusKind | null>(null);
  const [preferredUntil, setPreferredUntil] = useState<number | undefined>(undefined);

  const previousResolvedKindRef = useRef<DesktopStatusKind | undefined>(undefined);
  const previousResolvedChangedAtRef = useRef<number | undefined>(undefined);
  const activatedAtByKindRef = useRef<Partial<Record<DesktopStatusKind, number>>>({});

  // Subscribe to runtime changes + initial refresh
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

  // Aggregation + resolution (computed during render)
  const aggregatedStatus = aggregateDesktopStatusInput({
    hubState,
    availableKinds: DESKTOP_STATUS_TEMPLATE_ORDER,
    externalActiveKinds: systemMonitors?.externalActiveKinds,
    externalStates: systemMonitors?.externalStates,
  });

  const now = Date.now();

  // Build full resolved state map (defaults + aggregated overrides)
  const defaultStates = createDesktopStatusStateMap(metrics);
  const resolvedStates: Partial<DesktopStatusStateMap> = { ...defaultStates };
  if (aggregatedStatus.states) {
    for (const [kind, state] of Object.entries(aggregatedStatus.states)) {
      if (state) {
        (resolvedStates as Record<string, DesktopStatusState>)[kind] = state;
      }
    }
  }
  // Ensure resident always has live metrics and source status
  resolvedStates.resident = {
    ...defaultStates.resident,
    ...aggregatedStatus.states?.resident,
    metrics: aggregatedStatus.states?.resident?.metrics ?? metrics,
    sourceStatus: aggregatedStatus.states?.resident?.sourceStatus ??
      defaultStates.resident.sourceStatus ?? { quality: systemPerformanceSourceQuality as "live" | "fallback" | "stale" | "unavailable" },
  };

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
    metrics,
    systemPerformanceSourceStatus: { quality: systemPerformanceSourceQuality as "live" | "fallback" | "stale" | "unavailable" },
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
    hubState,
    resolvedState,
    resolvedStates,
    activeKinds: aggregatedStatus.activeKinds,
    activeStatusKind,
    preferredUntil,
    setActiveStatusKind,
    setPreferredUntil,
    refreshRuntime,
    preferredWindowMs: DESKTOP_STATUS_PREFERRED_WINDOW_MS,
  };
}
