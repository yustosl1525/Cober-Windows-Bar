import { useEffect, useState } from "react";
import i18n from "../../../i18n";
import {
  getFocusAssistState,
  onFocusAssistChanged,
  onNotificationsChanged,
  type FocusAssistState,
  type NotificationSummary,
} from "../../../runtime/systemMonitorRuntime";
import type {
  DesktopFocusState,
  DesktopStatusKind,
  DesktopStatusStateMap,
  GuestProviderSourceHealth,
} from "../../../types/hub";

export type SystemMonitorResult = {
  externalActiveKinds: DesktopStatusKind[];
  externalStates: Partial<DesktopStatusStateMap>;
  focusAssistState: FocusAssistState | undefined;
  notificationSummary: NotificationSummary | undefined;
  sourceHealth: GuestProviderSourceHealth | undefined;
};

function buildFocusState(focus: FocusAssistState): DesktopFocusState {
  const t = i18n.t.bind(i18n);
  const profileLabel = focus.profile
    ? focus.profile.replace("Microsoft.Windows.Focus_", "")
    : "";

  return {
    kind: "focus",
    title: t("aggregation.focusMode"),
    subtitle: t("aggregation.systemStatus"),
    source: "system",
    sessionLabel: profileLabel
      ? t("aggregation.profileModeEnabled", { profile: profileLabel })
      : t("aggregation.focusAssistEnabled"),
    detail: t("aggregation.doNotDisturb"),
    accent: "pink",
    sourceHealth: {
      kind: "focus",
      quality: "native",
      code: "available",
      safeToDisplay: true,
      lastCheckedAt: focus.checkedAt,
    },
  };
}

export function useSystemMonitors(): SystemMonitorResult {
  const [focusState, setFocusState] = useState<FocusAssistState | undefined>(undefined);
  const [notifSummary, setNotifSummary] = useState<NotificationSummary | undefined>(undefined);

  // Load initial focus assist state
  useEffect(() => {
    void getFocusAssistState().then((state) => {
      if (state) {
        setFocusState(state);
      }
    });
  }, []);

  // Subscribe to focus assist changes
  useEffect(() => {
    let unsub: (() => void) | undefined;

    void onFocusAssistChanged((state) => {
      setFocusState(state);
    }).then((unlisten) => {
      unsub = unlisten;
    });

    return () => {
      unsub?.();
    };
  }, []);

  // Subscribe to notification changes
  useEffect(() => {
    let unsub: (() => void) | undefined;

    void onNotificationsChanged((summary) => {
      setNotifSummary(summary);
    }).then((unlisten) => {
      unsub = unlisten;
    });

    return () => {
      unsub?.();
    };
  }, []);

  // Derive external active kinds and states
  const externalActiveKinds: DesktopStatusKind[] = [];
  const externalStates: Partial<DesktopStatusStateMap> = {};
  let sourceHealth: GuestProviderSourceHealth | undefined;

  if (focusState?.active) {
    externalActiveKinds.push("focus");
    externalStates.focus = buildFocusState(focusState);
    sourceHealth = {
      kind: "focus",
      quality: "native",
      code: "available",
      safeToDisplay: true,
      lastCheckedAt: focusState.checkedAt,
    };
  }

  return {
    externalActiveKinds,
    externalStates,
    focusAssistState: focusState,
    notificationSummary: notifSummary,
    sourceHealth,
  };
}
