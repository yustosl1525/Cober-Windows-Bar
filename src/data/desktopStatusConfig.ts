import type {
  DesktopStatusConfig,
  DesktopStatusKind,
  DesktopStatusMenuAction,
  DesktopStatusPreferenceKey,
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

const COPY = {
  templateDescriptors: [
    {
      kind: "resident",
      label: "\u5e38\u9a7b\u6001",
      description: "\u9ed8\u8ba4\u5c55\u793a CPU\u3001\u5185\u5b58\u548c\u7f51\u7edc\u4e09\u9879\u6838\u5fc3\u6307\u6807\u3002",
      providerHint: "system performance",
    },
    {
      kind: "media",
      label: "\u5a92\u4f53\u6001",
      description: "\u5c55\u793a\u6b63\u5728\u64ad\u653e\u7684\u5a92\u4f53\u4fe1\u606f\u4e0e\u8fdb\u5ea6\u3002",
      providerHint: "media session",
    },
    {
      kind: "download",
      label: "\u4e0b\u8f7d\u6001",
      description: "\u5c55\u793a\u4e0b\u8f7d\u4efb\u52a1\u548c\u4f20\u8f93\u8fdb\u5ea6\u3002",
      providerHint: "download watcher",
    },
    {
      kind: "update",
      label: "\u66f4\u65b0\u6001",
      description: "\u5c55\u793a\u7cfb\u7edf\u6216\u5e94\u7528\u66f4\u65b0\u8fdb\u5ea6\u3002",
      providerHint: "update service",
    },
    {
      kind: "clipboard",
      label: "\u526a\u8d34\u677f\u6001",
      description: "\u5c55\u793a\u6700\u8fd1\u590d\u5236\u5185\u5bb9\u4e0e\u6765\u6e90\u3002",
      providerHint: "clipboard watcher",
    },
    {
      kind: "focus",
      label: "\u4e13\u6ce8\u6001",
      description: "\u5c55\u793a\u4e13\u6ce8\u6a21\u5f0f\u6216\u8ba1\u65f6\u72b6\u6001\u3002",
      providerHint: "focus assist",
    },
  ] satisfies DesktopStatusTemplateDescriptor[],
  labels: {
    metrics: {
      cpu: "CPU",
      memory: "\u5185\u5b58",
      network: "\u7f51\u7edc",
    },
    currentUsage: "\u5f53\u524d\u4f7f\u7528\u7387",
    menu: {
      refreshData: "\u5237\u65b0\u6570\u636e",
      alwaysFloat: "\u603b\u662f\u60ac\u6d6e",
      avoidFullscreen: "\u5168\u5c4f\u65f6\u907f\u8ba9",
      lockPosition: "\u9501\u5b9a\u4f4d\u7f6e",
      resetPosition: "\u91cd\u7f6e\u4f4d\u7f6e",
      openSettings: "\u6253\u5f00\u8bbe\u7f6e",
      quit: "\u9000\u51fa",
    },
  },
  residentState: {
    title: "\u7cfb\u7edf\u6027\u80fd",
    subtitle: "\u5e38\u9a7b\u72b6\u6001\u4e2d\u5fc3",
  },
  mediaState: {
    title: "Neon Focus",
    subtitle: "\u6b63\u5728\u64ad\u653e",
    artist: "Cober Player",
    timeLabel: "01:42 / 03:28",
  },
  downloadState: {
    title: "Windows ISO",
    subtitle: "\u4e0b\u8f7d\u4efb\u52a1",
    detail: "3.1 GB / 5.4 GB",
  },
  updateState: {
    title: "\u7cfb\u7edf\u66f4\u65b0",
    subtitle: "\u51c6\u5907\u91cd\u542f",
    detail: "KB5039302",
  },
  clipboardState: {
    title: "\u5df2\u590d\u5236\u5185\u5bb9",
    subtitle: "\u526a\u8d34\u677f\u66f4\u65b0",
    detail: "\u6765\u81ea\u6d4f\u89c8\u5668",
    copiedText: "https://github.com/jay77721/Cober-Windows-Bar",
  },
  focusState: {
    title: "\u4e13\u6ce8\u6a21\u5f0f",
    subtitle: "\u5df2\u5f00\u542f",
    sessionLabel: "\u6df1\u5ea6\u5de5\u4f5c 25 \u5206\u949f",
    detail: "\u5269\u4f59 12 \u5206\u949f",
  },
} as const;

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

export const DESKTOP_STATUS_TEMPLATE_DESCRIPTORS: DesktopStatusTemplateDescriptor[] = [
  ...COPY.templateDescriptors,
];

export const desktopStatusConfig: DesktopStatusConfig = {
  preferences: {
    alwaysFloat: true,
    avoidFullscreen: true,
    lockPosition: false,
  },
  labels: COPY.labels,
  menuActions: [
    { id: "refresh-data", label: COPY.labels.menu.refreshData, kind: "action" },
    { id: "always-float", label: COPY.labels.menu.alwaysFloat, kind: "toggle", preferenceKey: "alwaysFloat" },
    { id: "avoid-fullscreen", label: COPY.labels.menu.avoidFullscreen, kind: "toggle", preferenceKey: "avoidFullscreen" },
    { id: "lock-position", label: COPY.labels.menu.lockPosition, kind: "toggle", preferenceKey: "lockPosition" },
    { id: "reset-position", label: COPY.labels.menu.resetPosition, kind: "action" },
    { id: "open-settings", label: COPY.labels.menu.openSettings, kind: "action" },
    { id: "quit", label: COPY.labels.menu.quit, kind: "action" },
  ],
};

export function getDesktopStatusConfig(): DesktopStatusConfig {
  return desktopStatusConfig;
}

export function getDesktopStatusLabels() {
  return desktopStatusConfig.labels;
}

export function getDesktopStatusPreferences() {
  return desktopStatusConfig.preferences;
}

export function getDesktopStatusMenuActions(): DesktopStatusMenuAction[] {
  return desktopStatusConfig.menuActions;
}

export function getDesktopStatusPreferenceEntries() {
  return desktopStatusConfig.menuActions.filter(
    (
      action,
    ): action is DesktopStatusMenuAction & {
      preferenceKey: DesktopStatusPreferenceKey;
    } => action.kind === "toggle" && Boolean(action.preferenceKey),
  );
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
  return {
    resident: {
      kind: "resident",
      title: COPY.residentState.title,
      subtitle: COPY.residentState.subtitle,
      source: "system",
      metrics: metrics.map((metric) => ({ ...metric })),
    },
    media: {
      kind: "media",
      title: COPY.mediaState.title,
      subtitle: COPY.mediaState.subtitle,
      source: "mock",
      artist: COPY.mediaState.artist,
      timeLabel: COPY.mediaState.timeLabel,
      progress: 48,
      accent: "violet",
    },
    download: {
      kind: "download",
      title: COPY.downloadState.title,
      subtitle: COPY.downloadState.subtitle,
      source: "mock",
      detail: COPY.downloadState.detail,
      progress: 57,
      accent: "green",
    },
    update: {
      kind: "update",
      title: COPY.updateState.title,
      subtitle: COPY.updateState.subtitle,
      source: "mock",
      detail: COPY.updateState.detail,
      progress: 81,
      accent: "orange",
    },
    clipboard: {
      kind: "clipboard",
      title: COPY.clipboardState.title,
      subtitle: COPY.clipboardState.subtitle,
      source: "mock",
      copiedText: COPY.clipboardState.copiedText,
      detail: COPY.clipboardState.detail,
      accent: "blue",
    },
    focus: {
      kind: "focus",
      title: COPY.focusState.title,
      subtitle: COPY.focusState.subtitle,
      source: "mock",
      sessionLabel: COPY.focusState.sessionLabel,
      detail: COPY.focusState.detail,
      accent: "pink",
    },
  };
}
