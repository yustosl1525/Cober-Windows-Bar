import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Cpu } from "lucide-react";
import { systemPerformanceMetrics } from "../../data/mockHubData";
import type {
  DesktopStatusPreferences,
  DesktopStatusPreferencesPayload,
  SystemPerformanceMetric,
} from "../../types/hub";
import {
  listenStatusCenterMenuActions,
  listenStatusCenterSettings,
  type StatusCenterMenuAction,
} from "../../runtime/desktopProductRuntime";
import { loadSystemPerformance } from "../../runtime/systemPerformanceRuntime";
import { getTauriInvoke } from "../../runtime/tauriRuntime";
import {
  captureStatusWindowDragState,
  correctStatusWindowPosition,
  correctStatusWindowPositionForDisplayChange,
  createDebouncedWindowCorrection,
  createStatusWindowOverlayState,
  enforceStatusWindowOverlay,
  moveStatusWindowDrag,
  scheduleOverlayStartupReassert,
  STATUS_WINDOW_CORRECT_POSITION_COMMAND,
  STATUS_WINDOW_DISPLAY_CHANGE_DEBOUNCE_MS,
  STATUS_WINDOW_FLOATING_COMMAND,
  STATUS_WINDOW_SCALE_CHANGE_DEBOUNCE_MS,
  type StatusWindowDragState,
} from "../../runtime/statusWindowRuntime";

const STATUS_REFRESH_MS = 1800;
const OVERLAY_POLICY_MS = 700;
const CURRENT_USAGE_LABEL = "\u5F53\u524D\u4F7F\u7528\u7387";
const STATUS_CENTER_CONTEXT_MENU_COMMAND = "show_status_center_context_menu";
const STATUS_CENTER_SETTINGS_COMMAND = "get_status_center_settings";

const DEFAULT_PREFERENCES: DesktopStatusPreferences = {
  alwaysFloat: true,
  avoidFullscreen: true,
  lockPosition: false,
};

type DragPointer = {
  x: number;
  y: number;
};

export function DesktopPage() {
  const [metrics, setMetrics] = useState<SystemPerformanceMetric[]>(systemPerformanceMetrics);
  const [preferences, setPreferences] = useState<DesktopStatusPreferences>(DEFAULT_PREFERENCES);
  const dragStateRef = useRef<StatusWindowDragState | null>(null);
  const dragPointerRef = useRef<DragPointer | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const dragMoveInFlightRef = useRef(false);
  const pendingPositionCorrectionRef = useRef(false);
  const isDraggingRef = useRef(false);
  const overlayStateRef = useRef(createStatusWindowOverlayState());
  const appWindowRef = useRef(getCurrentWindow());

  function mergePreferences(nextPreferences: Partial<DesktopStatusPreferences>) {
    setPreferences((previous) => ({ ...previous, ...nextPreferences }));
  }

  async function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (preferences.lockPosition || event.button !== 0) {
      return;
    }

    event.preventDefault();
    isDraggingRef.current = true;
    pendingPositionCorrectionRef.current = false;
    dragPointerRef.current = { x: event.screenX, y: event.screenY };

    const nextDragState = await captureStatusWindowDragState(event.screenX, event.screenY);
    dragStateRef.current = nextDragState;

    if (!nextDragState) {
      isDraggingRef.current = false;
      dragPointerRef.current = null;
    }
  }

  async function refresh() {
    if (isDraggingRef.current) {
      return;
    }

    const nextMetrics = await loadSystemPerformance();
    setMetrics(nextMetrics);
  }

  async function showNativeContextMenu(x: number, y: number) {
    const invoke = getTauriInvoke();
    if (!invoke || isDraggingRef.current) {
      return;
    }

    await invoke(STATUS_CENTER_CONTEXT_MENU_COMMAND, { x, y });
  }

  async function resetPosition() {
    const invoke = getTauriInvoke();
    if (!invoke) {
      return;
    }

    await invoke(STATUS_WINDOW_CORRECT_POSITION_COMMAND);
  }

  async function setAlwaysFloat(nextValue: boolean) {
    const invoke = getTauriInvoke();
    mergePreferences({ alwaysFloat: nextValue });

    if (!invoke) {
      return;
    }

    await invoke(STATUS_WINDOW_FLOATING_COMMAND, { floating: nextValue });
  }

  function setAvoidFullscreen(nextValue: boolean) {
    mergePreferences({ avoidFullscreen: nextValue });
    scheduleOverlayStartupReassert(overlayStateRef.current);
  }

  function setLockPosition(nextValue: boolean) {
    mergePreferences({ lockPosition: nextValue });

    if (nextValue) {
      isDraggingRef.current = false;
      dragStateRef.current = null;
      dragPointerRef.current = null;
    }
  }

  async function quitStatusCenter() {
    await appWindowRef.current.close();
  }

  async function handleMenuAction(action: StatusCenterMenuAction, checked?: boolean) {
    switch (action) {
      case "refresh-data":
        await refresh();
        return;
      case "toggle-always-float":
        if (typeof checked === "boolean") {
          await setAlwaysFloat(checked);
        }
        return;
      case "toggle-avoid-fullscreen":
        if (typeof checked === "boolean") {
          setAvoidFullscreen(checked);
        }
        return;
      case "toggle-lock-position":
        if (typeof checked === "boolean") {
          setLockPosition(checked);
        }
        return;
      case "reset-position":
        await resetPosition();
        return;
      case "open-settings":
        window.alert(
          "\u8BBE\u7F6E\u9762\u677F\u5C06\u5728\u4E0B\u4E00\u6CE2\u7248\u672C\u63A5\u5165\u3002",
        );
        return;
      case "quit":
        await quitStatusCenter();
        return;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function refreshMetrics() {
      if (isDraggingRef.current) {
        return;
      }

      const nextMetrics = await loadSystemPerformance();
      if (mounted) {
        setMetrics(nextMetrics);
      }
    }

    void refreshMetrics();
    const timer = window.setInterval(() => {
      void refreshMetrics();
    }, STATUS_REFRESH_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const invoke = getTauriInvoke();
    if (!invoke) {
      return;
    }

    scheduleOverlayStartupReassert(overlayStateRef.current);

    async function updateOverlayPolicy() {
      if (isDraggingRef.current) {
        return;
      }

      try {
        await enforceStatusWindowOverlay(overlayStateRef.current, { invoke });
      } catch {
        // Keep the last known floating state if foreground-window detection is unavailable.
      }
    }

    void updateOverlayPolicy();
    const timer = window.setInterval(() => {
      void updateOverlayPolicy();
    }, OVERLAY_POLICY_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const invoke = getTauriInvoke();
    if (!invoke) {
      return;
    }

    const appWindow = appWindowRef.current;
    const scaleCorrection = createDebouncedWindowCorrection(async () => {
      if (isDraggingRef.current) {
        return;
      }

      scheduleOverlayStartupReassert(overlayStateRef.current);
      await correctStatusWindowPosition(invoke);
    }, STATUS_WINDOW_SCALE_CHANGE_DEBOUNCE_MS);
    const displayCorrection = createDebouncedWindowCorrection(async () => {
      if (isDraggingRef.current) {
        return;
      }

      scheduleOverlayStartupReassert(overlayStateRef.current);
      await correctStatusWindowPositionForDisplayChange(invoke);
    }, STATUS_WINDOW_DISPLAY_CHANGE_DEBOUNCE_MS);

    let disposed = false;
    const cleanups: Array<() => void> = [];

    void (async () => {
      const [offMoved, offResized, offScaleChanged] = await Promise.all([
        appWindow.onMoved(() => {
          displayCorrection.trigger();
        }),
        appWindow.onResized(() => {
          displayCorrection.trigger();
        }),
        appWindow.onScaleChanged(() => {
          scaleCorrection.trigger();
        }),
      ]);

      if (disposed) {
        await Promise.all([offMoved(), offResized(), offScaleChanged()]);
        return;
      }

      cleanups.push(offMoved, offResized, offScaleChanged);
    })();

    return () => {
      disposed = true;
      scaleCorrection.cancel();
      displayCorrection.cancel();
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, []);

  useEffect(() => {
    const invoke = getTauriInvoke();
    if (!invoke) {
      return;
    }

    let disposed = false;
    let offMenuActions: (() => void) | undefined;
    let offSettings: (() => void) | undefined;

    function applySettings(payload: DesktopStatusPreferencesPayload) {
      if (disposed) {
        return;
      }

      setPreferences({ ...payload.preferences });
    }

    void (async () => {
      const settingsResult = await invoke(STATUS_CENTER_SETTINGS_COMMAND);
      if (!disposed && isPreferencesPayload(settingsResult)) {
        setPreferences({ ...settingsResult.preferences });
      }

      offMenuActions = await listenStatusCenterMenuActions(async ({ action, checked }) => {
        await handleMenuAction(action, checked);
      });

      offSettings = await listenStatusCenterSettings((payload) => {
        applySettings(payload);
      });
    })();

    return () => {
      disposed = true;
      offMenuActions?.();
      offSettings?.();
    };
  }, []);

  useEffect(() => {
    function clearPendingDragFrame() {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
    }

    function scheduleDragMove() {
      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null;

        const dragState = dragStateRef.current;
        const pointer = dragPointerRef.current;
        if (!dragState || !pointer || dragMoveInFlightRef.current) {
          return;
        }

        const { x, y } = pointer;
        dragMoveInFlightRef.current = true;

        void moveStatusWindowDrag(dragState, x, y)
          .catch(() => {
            dragStateRef.current = null;
            dragPointerRef.current = null;
            isDraggingRef.current = false;
            pendingPositionCorrectionRef.current = false;
          })
          .finally(() => {
            dragMoveInFlightRef.current = false;

            if (pendingPositionCorrectionRef.current && !isDraggingRef.current) {
              pendingPositionCorrectionRef.current = false;
              void correctStatusWindowPosition();
              return;
            }

            const latestPointer = dragPointerRef.current;
            if (
              dragStateRef.current &&
              latestPointer &&
              (latestPointer.x !== x || latestPointer.y !== y)
            ) {
              scheduleDragMove();
            }
          });
      });
    }

    function handlePointerMove(event: PointerEvent) {
      if (!isDraggingRef.current) {
        return;
      }

      dragPointerRef.current = { x: event.screenX, y: event.screenY };
      scheduleDragMove();
    }

    function handlePointerUp() {
      const wasDragging = isDraggingRef.current || dragStateRef.current !== null;

      clearPendingDragFrame();
      isDraggingRef.current = false;
      dragStateRef.current = null;
      dragPointerRef.current = null;

      if (wasDragging) {
        if (dragMoveInFlightRef.current) {
          pendingPositionCorrectionRef.current = true;
          return;
        }

        void correctStatusWindowPosition();
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("blur", handlePointerUp);

    return () => {
      clearPendingDragFrame();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("blur", handlePointerUp);
    };
  }, []);

  async function handleContextMenu(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    await showNativeContextMenu(event.clientX, event.clientY);
  }

  return (
    <main
      className="product-status-window"
      data-testid="desktop-preview"
      onContextMenu={handleContextMenu}
      onPointerDownCapture={handlePointerDown}
    >
      <section className="product-status-center" aria-label="Cober system performance status center">
        <div className="product-status-icon" aria-hidden="true">
          <Cpu size={36} strokeWidth={2.35} />
        </div>

        <div className="product-status-metrics">
          {metrics.map((metric) => {
            const accent = metricAccent(metric);
            const label = `${metric.label} ${CURRENT_USAGE_LABEL} ${metric.value}%`;

            return (
              <div className="product-status-metric" key={metric.id} aria-label={label} title={label}>
                <div className="product-status-label">
                  <strong>{metric.label}</strong>
                  <span>{metric.value}%</span>
                </div>
                <span
                  className="product-status-track"
                  role="progressbar"
                  aria-label={label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={metric.value}
                >
                  <span
                    style={{
                      width: `${visibleMetricValue(metric.value)}%`,
                      background: accent,
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function isPreferencesPayload(value: unknown): value is DesktopStatusPreferencesPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const preferences = (value as DesktopStatusPreferencesPayload).preferences;

  return (
    typeof preferences?.alwaysFloat === "boolean" &&
    typeof preferences.avoidFullscreen === "boolean" &&
    typeof preferences.lockPosition === "boolean"
  );
}

function visibleMetricValue(value: number) {
  return value <= 0 ? 8 : Math.max(value, 8);
}

function metricAccent(metric: SystemPerformanceMetric) {
  if (metric.value > 80) {
    return "linear-gradient(90deg, #fb923c 0%, #ef4444 100%)";
  }

  if (metric.value >= 50) {
    switch (metric.tone) {
      case "blue":
        return "linear-gradient(90deg, #2f8fed 0%, #60a5fa 100%)";
      case "violet":
        return "linear-gradient(90deg, #7c6cff 0%, #a78bfa 100%)";
      case "cyan":
        return "linear-gradient(90deg, #0fa7ad 0%, #2dd4bf 100%)";
    }
  }

  switch (metric.tone) {
    case "blue":
      return "linear-gradient(90deg, #1473f8 0%, #2f8fed 100%)";
    case "violet":
      return "linear-gradient(90deg, #6d5dfc 0%, #8b7cff 100%)";
    case "cyan":
      return "linear-gradient(90deg, #079aa2 0%, #0fa7ad 100%)";
  }
}
