import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Clipboard,
  Cpu,
  Download,
  MoonStar,
  Music4,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DESKTOP_STATUS_PRIORITY_ORDER,
  getDesktopStatusShellCopy,
} from "../../data/desktopStatusConfig";
import {
  correctStatusWindowPosition,
  scheduleOverlayStartupReassert,
  STATUS_WINDOW_CORRECT_POSITION_COMMAND,
} from "../../runtime/statusWindowRuntime";
import { emitTauriFixtureEvents, getTauriInvoke } from "../../runtime/tauriRuntime";
import { getAutostartEnabled, setAutostartEnabled as applyAutostart } from "../../runtime/autostartRuntime";
import type { DesktopStatusKind, DesktopStatusState, DesktopStatusStateMap } from "../../types/hub";
import { SettingsPanel } from "./components/SettingsPanel";
import {
  useContextMenu,
  useDesktopStatusRuntime,
  useDragController,
  useOverlayPolicy,
  usePreferences,
  useSystemMonitors,
  useSystemPerformance,
} from "./hooks";
import { ClipboardStatusTemplate } from "./templates/ClipboardStatusTemplate";
import { DownloadStatusTemplate } from "./templates/DownloadStatusTemplate";
import { FocusStatusTemplate } from "./templates/FocusStatusTemplate";
import { MediaStatusTemplate } from "./templates/MediaStatusTemplate";
import { ResidentStatusTemplate } from "./templates/ResidentStatusTemplate";
import { UpdateStatusTemplate } from "./templates/UpdateStatusTemplate";

const STATUS_CENTER_CONTEXT_MENU_COMMAND = "show_status_center_context_menu";
const OPEN_STATUS_CENTER_SETTINGS_COMMAND = "open_status_center_settings";
const SHOW_STATUS_CENTER_WINDOW_COMMAND = "show_status_center_window";

/** Base pill width when only the resident template is shown. */
const PILL_BASE_WIDTH = 303;
/** Extra width added per active guest indicator. */
const PILL_INDICATOR_WIDTH = 36;
/** Maximum pill width (resident + up to 5 guest indicators). */
const PILL_MAX_WIDTH = 500;

type TauriAppWindow = ReturnType<typeof getCurrentWindow>;

function getSafeCurrentWindow(): TauriAppWindow | undefined {
  try {
    return getCurrentWindow();
  } catch {
    return undefined;
  }
}

function renderTemplate(state: DesktopStatusState) {
  switch (state.kind) {
    case "resident":
      return <ResidentStatusTemplate state={state} />;
    case "media":
      return <MediaStatusTemplate state={state} />;
    case "download":
      return <DownloadStatusTemplate state={state} />;
    case "update":
      return <UpdateStatusTemplate state={state} />;
    case "clipboard":
      return <ClipboardStatusTemplate state={state} />;
    case "focus":
      return <FocusStatusTemplate state={state} />;
  }
}

function indicatorIcon(kind: DesktopStatusKind, size = 14) {
  const props = { size, strokeWidth: 2 };
  switch (kind) {
    case "resident":
      return <Cpu {...props} />;
    case "media":
      return <Music4 {...props} />;
    case "download":
      return <Download {...props} />;
    case "update":
      return <RefreshCw {...props} />;
    case "clipboard":
      return <Clipboard {...props} />;
    case "focus":
      return <MoonStar {...props} />;
  }
}

export function DesktopPage() {
  const { t } = useTranslation();
  const appWindowRef = useRef<TauriAppWindow | undefined>(getSafeCurrentWindow());
  const shellCopy = getDesktopStatusShellCopy();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [focusedKind, setFocusedKind] = useState<DesktopStatusKind | null>(null);

  // Load initial autostart state
  useEffect(() => {
    void getAutostartEnabled().then(setAutostartEnabled);
  }, []);

  // Drag controller
  const { isDraggingRef, lockPositionRef, handlePointerDown } = useDragController();

  // System performance polling
  const { metrics, diagnostic, metricsRef, diagnosticRef, refreshMetrics } = useSystemPerformance();

  // System monitors (Focus Assist, notifications)
  const systemMonitors = useSystemMonitors();

  // Desktop status runtime + aggregation + state resolution
  const {
    resolvedState,
    resolvedStates,
    activeKinds,
    activeStatusKind,
    preferredUntil,
    setActiveStatusKind,
    setPreferredUntil,
    refreshRuntime,
    preferredWindowMs,
  } = useDesktopStatusRuntime(metrics, diagnostic.quality, {
    externalActiveKinds: systemMonitors.externalActiveKinds,
    externalStates: systemMonitors.externalStates,
  });

  // Guest indicators: active kinds excluding "resident", sorted by priority
  const guestIndicators = useMemo(() => {
    return DESKTOP_STATUS_PRIORITY_ORDER.filter(
      (kind) => kind !== "resident" && activeKinds.includes(kind),
    );
  }, [activeKinds]);

  // Clear focused kind if it's no longer active
  useEffect(() => {
    if (focusedKind && !guestIndicators.includes(focusedKind)) {
      setFocusedKind(null);
    }
  }, [focusedKind, guestIndicators]);

  // The state to render in the detail area
  const focusedState = focusedKind
    ? resolvedStates[focusedKind] ?? resolvedState
    : resolvedStates.resident ?? resolvedState;

  // Dynamic pill width
  const pillWidth = Math.min(
    PILL_BASE_WIDTH + guestIndicators.length * PILL_INDICATOR_WIDTH,
    PILL_MAX_WIDTH,
  );

  // Preferences
  const { preferences, updatePreferences } = usePreferences();

  // Sync lockPosition to drag controller ref
  lockPositionRef.current = preferences.lockPosition;

  // Overlay policy (fullscreen avoidance + floating)
  const { overlayStateRef } = useOverlayPolicy({
    avoidFullscreen: preferences.avoidFullscreen,
    isDraggingRef,
  });

  // Preferred kind timer expiry
  useEffect(() => {
    if (preferredUntil === undefined) {
      return;
    }

    if (preferredUntil <= Date.now()) {
      setPreferredUntil(undefined);
      setActiveStatusKind(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setPreferredUntil(undefined);
      setActiveStatusKind(null);
    }, Math.max(0, preferredUntil - Date.now()));

    return () => window.clearTimeout(timer);
  }, [preferredUntil, setPreferredUntil, setActiveStatusKind]);

  // -- Action handlers --

  async function refresh() {
    if (isDraggingRef.current) {
      return;
    }

    const invoke = getTauriInvoke();
    if (invoke) {
      await emitTauriFixtureEvents({ invoke });
    }

    await Promise.all([refreshMetrics(), refreshRuntime()]);
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

  function openSettings() {
    setSettingsOpen(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  function handleKindSelect(kind: DesktopStatusKind) {
    setActiveStatusKind(kind);
    setPreferredUntil(Date.now() + preferredWindowMs);
  }

  function handleIndicatorClick(kind: DesktopStatusKind) {
    // Toggle: clicking the focused indicator unfocuses it (returns to resident)
    if (focusedKind === kind) {
      setFocusedKind(null);
    } else {
      setFocusedKind(kind);
    }
    // Also update the runtime preferred kind
    setActiveStatusKind(kind);
    setPreferredUntil(Date.now() + preferredWindowMs);
  }

  async function toggleAlwaysFloat() {
    await updatePreferences({ alwaysFloat: !preferences.alwaysFloat });
  }

  function toggleAvoidFullscreen() {
    void updatePreferences({ avoidFullscreen: !preferences.avoidFullscreen });
    scheduleOverlayStartupReassert(overlayStateRef.current);
  }

  function toggleLockPosition() {
    const nextValue = !preferences.lockPosition;
    void updatePreferences({ lockPosition: nextValue });

    if (nextValue) {
      isDraggingRef.current = false;
    }
  }

  async function toggleAutostart() {
    const nextValue = !autostartEnabled;
    const success = await applyAutostart(nextValue);
    if (success) {
      setAutostartEnabled(nextValue);
    }
  }

  async function quitStatusCenter() {
    const invoke = getTauriInvoke();
    if (!invoke) {
      await appWindowRef.current?.hide();
      return;
    }

    try {
      await invoke("quit_status_center");
    } catch {
      await appWindowRef.current?.hide();
    }
  }

  async function handleMenuAction(action: string, checked?: boolean) {
    switch (action) {
      case "refresh-data":
        await refresh();
        return;
      case "toggle-always-float":
        if (typeof checked === "boolean") {
          await updatePreferences({ alwaysFloat: checked });
        }
        return;
      case "toggle-avoid-fullscreen":
        if (typeof checked === "boolean") {
          void updatePreferences({ avoidFullscreen: checked });
          scheduleOverlayStartupReassert(overlayStateRef.current);
        }
        return;
      case "toggle-lock-position":
        if (typeof checked === "boolean") {
          void updatePreferences({ lockPosition: checked });
          if (checked) {
            isDraggingRef.current = false;
          }
        }
        return;
      case "reset-position":
        await resetPosition();
        return;
      case "open-settings":
        openSettings();
        return;
      case "quit":
        await quitStatusCenter();
        return;
    }
  }

  async function handleOpenSettingsClick() {
    const invoke = getTauriInvoke();
    if (!invoke) {
      openSettings();
      return;
    }

    await invoke(OPEN_STATUS_CENTER_SETTINGS_COMMAND);
  }

  async function recallStatusCenter() {
    const invoke = getTauriInvoke();
    if (!invoke) {
      await appWindowRef.current?.show();
      await appWindowRef.current?.setFocus();
      return;
    }

    await invoke(SHOW_STATUS_CENTER_WINDOW_COMMAND);
  }

  async function handleContextMenu(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    await showNativeContextMenu(event.clientX, event.clientY);
  }

  // Global context menu + Escape key
  useContextMenu({ settingsOpen, closeSettings, showNativeContextMenu });

  const hasGuestIndicators = guestIndicators.length > 0;

  return (
    <main
      className="product-status-window"
      data-testid="desktop-preview"
      onPointerDownCapture={handlePointerDown}
    >
      <section
        className={`product-status-center${hasGuestIndicators ? " has-indicators" : ""}`}
        aria-label={shellCopy.ariaLabel}
        style={{ width: `min(${pillWidth}px, calc(100vw - 12px))` }}
      >
        {/* Resident icon — always visible */}
        <div
          className={`product-status-icon product-status-icon-resident${
            !focusedKind ? " is-focused" : ""
          }`}
          aria-hidden="true"
          role={hasGuestIndicators ? "button" : undefined}
          tabIndex={hasGuestIndicators ? 0 : undefined}
          title={t("template.resident.label")}
          onClick={hasGuestIndicators ? () => setFocusedKind(null) : undefined}
        >
          <Cpu size={20} strokeWidth={2.2} />
        </div>

        {/* Guest indicator rail */}
        {hasGuestIndicators ? (
          <div className="product-status-indicator-rail" role="tablist" aria-label={t("common.statusIndicators")}>
            {guestIndicators.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`product-status-indicator product-status-indicator-${kind}${
                  focusedKind === kind ? " is-focused" : ""
                }`}
                aria-label={t(`template.${kind}.label`)}
                aria-selected={focusedKind === kind}
                role="tab"
                title={t(`template.${kind}.label`)}
                onClick={() => handleIndicatorClick(kind)}
              >
                {indicatorIcon(kind)}
              </button>
            ))}
          </div>
        ) : null}

        {/* Detail template area */}
        {renderTemplate(focusedState)}
      </section>

      {settingsOpen ? (
        <SettingsPanel
          preferences={preferences}
          activeStatusKind={activeStatusKind}
          autostartEnabled={autostartEnabled}
          onToggleAlwaysFloat={() => void toggleAlwaysFloat()}
          onToggleAvoidFullscreen={toggleAvoidFullscreen}
          onToggleLockPosition={toggleLockPosition}
          onToggleAutostart={() => void toggleAutostart()}
          onKindSelect={handleKindSelect}
          onRefresh={() => void refresh()}
          onResetPosition={() => void resetPosition()}
          onOpenNativeSettings={() => void handleOpenSettingsClick()}
          onRecallStatusCenter={() => void recallStatusCenter()}
          onClose={closeSettings}
        />
      ) : null}
    </main>
  );
}
