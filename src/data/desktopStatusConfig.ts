import i18n from "../i18n";
import type {
  DesktopStatusConfig,
  DesktopStatusKind,
  DesktopStatusMenuAction,
  DesktopStatusStateMap,
  DesktopStatusTemplateDescriptor,
  SystemPerformanceMetric,
  SystemPerformanceMetricId,
  SystemPerformanceSnapshot,
} from "../types/hub";

const DESKTOP_STATUS_METRIC_TONES: Record<SystemPerformanceMetricId, SystemPerformanceMetric["tone"]> = {
  cpu: "blue",
  memory: "violet",
  network: "cyan",
};

export const DESKTOP_STATUS_TEMPLATE_ORDER: DesktopStatusKind[] = [
  "resident",
  "media",
  "download",
  "update",
  "clipboard",
  "focus",
];

export const DESKTOP_STATUS_PRIORITY_ORDER: DesktopStatusKind[] = [
  "focus",
  "update",
  "download",
  "media",
  "clipboard",
  "resident",
];

const TEMPLATE_KINDS: DesktopStatusKind[] = [
  "resident",
  "media",
  "download",
  "update",
  "clipboard",
  "focus",
];

export function getDesktopStatusTemplateDescriptors(): DesktopStatusTemplateDescriptor[] {
  const t = i18n.t.bind(i18n);
  return TEMPLATE_KINDS.map((kind) => ({
    kind,
    label: t(`template.${kind}.label`),
    description: t(`template.${kind}.description`),
    providerHint: kind,
  }));
}

/** @deprecated Use getDesktopStatusTemplateDescriptors() instead */
export const DESKTOP_STATUS_TEMPLATE_DESCRIPTORS: DesktopStatusTemplateDescriptor[] =
  TEMPLATE_KINDS.map((kind) => ({
    kind,
    label: "",
    description: "",
    providerHint: kind,
  }));

export function getDesktopStatusLabels() {
  const t = i18n.t.bind(i18n);
  return {
    metrics: {
      cpu: t("metrics.cpu"),
      memory: t("metrics.memory"),
      network: t("metrics.network"),
    } as Record<SystemPerformanceMetricId, string>,
    currentUsage: t("metrics.currentUsage"),
    menu: {
      refreshData: t("menu.refreshData"),
      alwaysFloat: t("menu.alwaysFloat"),
      avoidFullscreen: t("menu.avoidFullscreen"),
      lockPosition: t("menu.lockPosition"),
      resetPosition: t("menu.resetPosition"),
      openSettings: t("menu.openSettings"),
      quit: t("menu.quit"),
    },
  };
}

export function createSystemPerformanceMetricSnapshot(
  snapshot: Pick<SystemPerformanceSnapshot, SystemPerformanceMetricId>,
): SystemPerformanceMetric[] {
  const labels = getDesktopStatusLabels().metrics;

  return (Object.keys(DESKTOP_STATUS_METRIC_TONES) as SystemPerformanceMetricId[]).map((id) => ({
    id,
    label: labels[id],
    value: snapshot[id],
    tone: DESKTOP_STATUS_METRIC_TONES[id],
  }));
}

export function createDesktopStatusStateTemplates(
  metrics: SystemPerformanceMetric[],
): DesktopStatusStateMap {
  const t = i18n.t.bind(i18n);
  return {
    resident: {
      kind: "resident",
      title: t("states.resident.title"),
      subtitle: t("states.resident.subtitle"),
      source: "system",
      metrics: metrics.map((metric) => ({ ...metric })),
    },
    media: {
      kind: "media",
      title: t("states.media.title"),
      subtitle: t("states.media.subtitle"),
      source: "mock",
      artist: t("states.media.artist"),
      timeLabel: t("states.media.timeLabel"),
      progress: 48,
      accent: "violet",
    },
    download: {
      kind: "download",
      title: t("states.download.title"),
      subtitle: t("states.download.subtitle"),
      source: "mock",
      detail: t("states.download.detail"),
      progress: 57,
      accent: "green",
    },
    update: {
      kind: "update",
      title: t("states.update.title"),
      subtitle: t("states.update.subtitle"),
      source: "mock",
      detail: t("states.update.detail"),
      progress: 81,
      accent: "orange",
    },
    clipboard: {
      kind: "clipboard",
      title: t("states.clipboard.title"),
      subtitle: t("states.clipboard.subtitle"),
      source: "mock",
      copiedText: t("states.clipboard.copiedText"),
      detail: t("states.clipboard.detail"),
      accent: "blue",
    },
    focus: {
      kind: "focus",
      title: t("states.focus.title"),
      subtitle: t("states.focus.subtitle"),
      source: "mock",
      sessionLabel: t("states.focus.sessionLabel"),
      detail: t("states.focus.detail"),
      accent: "pink",
    },
  };
}

export function getDesktopStatusTemplateChromeCopy() {
  const t = i18n.t.bind(i18n);
  return {
    residentEyebrow: t("template.resident.eyebrow"),
    mediaEyebrow: t("template.media.eyebrow"),
    downloadEyebrow: t("template.download.eyebrow"),
    updateEyebrow: t("template.update.eyebrow"),
    clipboardEyebrow: t("template.clipboard.eyebrow"),
    focusEyebrow: t("template.focus.eyebrow"),
    mediaProgress: t("template.media.progress"),
    downloadProgress: t("template.download.progress"),
    updateProgress: t("template.update.progress"),
  };
}

export function getDesktopStatusShellCopy() {
  const t = i18n.t.bind(i18n);
  return {
    ariaLabel: t("shell.ariaLabel"),
  };
}

export function getDesktopStatusSettingsCopy() {
  const t = i18n.t.bind(i18n);
  return {
    panel: {
      ariaLabel: t("settings.panel.ariaLabel"),
      title: t("settings.panel.title"),
      description: t("settings.panel.description"),
      closeLabel: t("settings.panel.closeLabel"),
    },
    sections: {
      windowBehavior: t("settings.sections.windowBehavior"),
      statusTemplates: t("settings.sections.statusTemplates"),
      quickActions: t("settings.sections.quickActions"),
    },
    toggles: {
      alwaysFloat: {
        title: t("settings.toggles.alwaysFloat.title"),
        description: t("settings.toggles.alwaysFloat.description"),
        activeLabel: t("settings.toggles.alwaysFloat.activeLabel"),
        inactiveLabel: t("settings.toggles.alwaysFloat.inactiveLabel"),
      },
      avoidFullscreen: {
        title: t("settings.toggles.avoidFullscreen.title"),
        description: t("settings.toggles.avoidFullscreen.description"),
        activeLabel: t("settings.toggles.avoidFullscreen.activeLabel"),
        inactiveLabel: t("settings.toggles.avoidFullscreen.inactiveLabel"),
      },
      lockPosition: {
        title: t("settings.toggles.lockPosition.title"),
        description: t("settings.toggles.lockPosition.description"),
        activeLabel: t("settings.toggles.lockPosition.activeLabel"),
        inactiveLabel: t("settings.toggles.lockPosition.inactiveLabel"),
      },
    },
    actions: {
      refresh: t("settings.actions.refresh"),
      resetPosition: t("settings.actions.resetPosition"),
      openNativeSettings: t("settings.actions.openNativeSettings"),
      recallStatusCenter: t("settings.actions.recallStatusCenter"),
      quickPanelTitle: t("settings.actions.quickPanelTitle"),
      quickPanelDescription: t("settings.actions.quickPanelDescription"),
    },
  };
}

const desktopStatusConfig: DesktopStatusConfig = {
  preferences: {
    alwaysFloat: true,
    avoidFullscreen: true,
    lockPosition: false,
  },
  labels: getDesktopStatusLabels(),
  menuActions: [
    { id: "refresh-data", label: getDesktopStatusLabels().menu.refreshData, kind: "action" },
    { id: "always-float", label: getDesktopStatusLabels().menu.alwaysFloat, kind: "toggle", preferenceKey: "alwaysFloat" },
    { id: "avoid-fullscreen", label: getDesktopStatusLabels().menu.avoidFullscreen, kind: "toggle", preferenceKey: "avoidFullscreen" },
    { id: "lock-position", label: getDesktopStatusLabels().menu.lockPosition, kind: "toggle", preferenceKey: "lockPosition" },
    { id: "reset-position", label: getDesktopStatusLabels().menu.resetPosition, kind: "action" },
    { id: "open-settings", label: getDesktopStatusLabels().menu.openSettings, kind: "action" },
    { id: "quit", label: getDesktopStatusLabels().menu.quit, kind: "action" },
  ],
};

export function getDesktopStatusMenuActions(): DesktopStatusMenuAction[] {
  const labels = getDesktopStatusLabels();
  return [
    { id: "refresh-data", label: labels.menu.refreshData, kind: "action" },
    { id: "always-float", label: labels.menu.alwaysFloat, kind: "toggle", preferenceKey: "alwaysFloat" },
    { id: "avoid-fullscreen", label: labels.menu.avoidFullscreen, kind: "toggle", preferenceKey: "avoidFullscreen" },
    { id: "lock-position", label: labels.menu.lockPosition, kind: "toggle", preferenceKey: "lockPosition" },
    { id: "reset-position", label: labels.menu.resetPosition, kind: "action" },
    { id: "open-settings", label: labels.menu.openSettings, kind: "action" },
    { id: "quit", label: labels.menu.quit, kind: "action" },
  ];
}

export default desktopStatusConfig;
