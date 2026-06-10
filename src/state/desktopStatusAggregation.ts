import i18n from "../i18n";
import { clampProgress, dedupeKinds } from "../shared/runtimeGuards";
import { createHubStoreState, getActiveHubEvents } from "./hubState";
import type {
  DesktopClipboardState,
  DesktopDownloadState,
  DesktopFocusState,
  DesktopMediaState,
  DesktopStatusAggregationInput,
  DesktopStatusAggregationResult,
  DesktopStatusKind,
  DesktopStatusState,
  DesktopStatusStateMap,
  DesktopUpdateState,
  HubEvent,
  HubStoreState,
  HubTask,
  MusicState,
} from "../types/hub";

const DESKTOP_STATUS_AVAILABLE_KINDS: DesktopStatusKind[] = [
  "resident",
  "media",
  "download",
  "update",
  "clipboard",
  "focus",
];


function normalizeAvailableKinds(kinds: DesktopStatusKind[] | undefined): DesktopStatusKind[] | undefined {
  if (!kinds?.length) {
    return undefined;
  }

  return dedupeKinds(kinds.filter((kind) => DESKTOP_STATUS_AVAILABLE_KINDS.includes(kind)));
}

function snapshotMusicState(music: MusicState): DesktopMediaState {
  return {
    kind: "media",
    title: music.title,
    subtitle: i18n.t("aggregation.nowPlaying"),
    source: "mock",
    artist: music.subtitle,
    timeLabel: music.time,
    progress: clampProgress(music.progress),
    accent: "violet",
  };
}

function snapshotDownloadTask(task: HubTask): DesktopDownloadState {
  return {
    kind: "download",
    title: task.title,
    subtitle: i18n.t("aggregation.downloadTask"),
    source: "mock",
    detail: task.subtitle || i18n.t("aggregation.transferring"),
    progress: clampProgress(task.progress),
    accent: "green",
  };
}

function snapshotAiTask(task: HubTask): DesktopUpdateState {
  return {
    kind: "update",
    title: task.title,
    subtitle: i18n.t("aggregation.inProgress"),
    source: "mock",
    detail: task.subtitle || i18n.t("aggregation.systemTaskProcessing"),
    progress: clampProgress(task.progress),
    accent: "orange",
  };
}

function snapshotNotificationEvent(event: HubEvent): DesktopClipboardState | DesktopFocusState | undefined {
  if (event.source === "notification") {
    const payload = event.payload && "message" in event.payload ? event.payload : undefined;

    return {
      kind: "clipboard",
      title: payload?.app ?? i18n.t("aggregation.desktopNotification"),
      subtitle: i18n.t("aggregation.recentMessage"),
      source: "mock",
      copiedText: payload?.message ?? i18n.t("aggregation.newNotificationReceived"),
      detail: payload?.sender ?? i18n.t("aggregation.notificationCenter"),
      accent: "blue",
    };
  }

  if (event.source === "system" && event.metadata?.["focus"] === true) {
    return {
      kind: "focus",
      title: i18n.t("aggregation.focusMode"),
      subtitle: i18n.t("aggregation.systemStatus"),
      source: "system",
      sessionLabel: typeof event.metadata["label"] === "string" ? event.metadata["label"] : i18n.t("aggregation.focusModeEnabled"),
      detail: typeof event.metadata["detail"] === "string" ? event.metadata["detail"] : i18n.t("aggregation.doNotDisturb"),
      accent: "pink",
    };
  }

  return undefined;
}

function deriveStateOverrides(hubState: HubStoreState): Partial<DesktopStatusStateMap> {
  const overrides: Partial<DesktopStatusStateMap> = {};

  if (hubState.music) {
    overrides.media = snapshotMusicState(hubState.music);
  }

  const downloadTask = hubState.tasks.find((task) => task.type === "download");
  if (downloadTask) {
    overrides.download = snapshotDownloadTask(downloadTask);
  }

  const aiTask = hubState.tasks.find((task) => task.type === "ai");
  if (aiTask) {
    overrides.update = snapshotAiTask(aiTask);
  }

  const latestNotification = hubState.events.find((event) => event.type === "notification");
  const notificationState = latestNotification ? snapshotNotificationEvent(latestNotification) : undefined;

  if (notificationState?.kind === "clipboard") {
    overrides.clipboard = notificationState;
  }

  if (notificationState?.kind === "focus") {
    overrides.focus = notificationState;
  }

  return overrides;
}

function deriveActiveKinds(hubState: HubStoreState, events: HubEvent[]): DesktopStatusKind[] {
  const activeKinds: DesktopStatusKind[] = [];

  if (hubState.music) {
    activeKinds.push("media");
  }

  if (hubState.tasks.some((task) => task.type === "download")) {
    activeKinds.push("download");
  }

  if (hubState.tasks.some((task) => task.type === "ai")) {
    activeKinds.push("update");
  }

  if (events.some((event) => event.type === "notification" && event.source === "notification")) {
    activeKinds.push("clipboard");
  }

  if (events.some((event) => event.source === "system" && event.metadata?.["focus"] === true)) {
    activeKinds.push("focus");
  }

  return dedupeKinds(activeKinds);
}

function resolveHubState(input: DesktopStatusAggregationInput): HubStoreState {
  if (input.hubState) {
    return input.hubState;
  }

  return createHubStoreState(input.events ?? [], input.now);
}

function resolveEvents(input: DesktopStatusAggregationInput): HubEvent[] {
  if (input.events) {
    return getActiveHubEvents(input.events, input.now);
  }

  return input.hubState?.events ?? [];
}

export function aggregateDesktopStatusInput(
  input: DesktopStatusAggregationInput = {},
): DesktopStatusAggregationResult {
  const hubState = resolveHubState(input);
  const events = resolveEvents(input);
  const states = deriveStateOverrides(hubState);
  const activeKinds = deriveActiveKinds(hubState, events);
  const availableKinds = normalizeAvailableKinds(input.availableKinds);

  // Merge external states (from system monitors: Focus Assist, notifications, etc.)
  if (input.externalStates) {
    for (const [kind, state] of Object.entries(input.externalStates) as [DesktopStatusKind, DesktopStatusState][]) {
      if (state) {
        (states as Record<string, unknown>)[kind] = state;
      }
    }
  }

  // Merge external active kinds (deduplicated)
  const mergedActiveKinds = input.externalActiveKinds?.length
    ? dedupeKinds([...activeKinds, ...input.externalActiveKinds])
    : activeKinds;

  return {
    activeKinds: mergedActiveKinds,
    availableKinds,
    states: Object.keys(states).length ? states : undefined,
  };
}
