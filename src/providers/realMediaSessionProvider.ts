import type { HubEvent } from "../types/hub";
import type { HubProvider, HubProviderCapability, HubProviderMetadata } from "./types";
import { createProviderShell } from "./providerShell";
import {
  loadTauriMediaSessionStatus,
  type TauriMediaSessionStatus,
} from "../runtime/tauriRuntime";
import {
  onMediaSessionChanged,
  type MediaSessionChangedPayload,
} from "../runtime/systemMonitorRuntime";
import { MEDIA_DISPLAY_WINDOW_MS, formatMediaTime } from "../shared/mediaTime";

const PROVIDER_ID = "real-media-session-provider";
const POLL_FALLBACK_MS = 30_000;

function mediaPayloadToEvent(payload: MediaSessionChangedPayload): HubEvent {
  const createdAt = payload.checkedAt || Date.now();
  const expiresAt = payload.available
    ? createdAt + MEDIA_DISPLAY_WINDOW_MS
    : createdAt;

  return {
    id: `${PROVIDER_ID}-media-${createdAt}`,
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
      title: payload.title,
      artist: payload.artist,
    },
    metadata: {
      timeLabel: formatMediaTime(payload.positionMs, payload.durationMs),
      code: payload.code,
    },
  };
}

function statusToPayload(status: TauriMediaSessionStatus): MediaSessionChangedPayload {
  return {
    available: status.available,
    playbackStatus: status.playbackStatus,
    progress: status.progress,
    positionMs: status.positionMs,
    durationMs: status.durationMs,
    title: status.title,
    artist: status.artist,
    code: status.code,
    checkedAt: status.checkedAt,
  };
}

export function createRealMediaSessionProvider(): HubProvider {
  let unlisten: (() => void) | undefined;
  let lastEmittedAvailable: boolean | undefined;

  const metadata: HubProviderMetadata = {
    id: PROVIDER_ID,
    name: "Media Session Provider",
    kind: "media",
    version: "1.0.0",
    mock: false,
  };

  const capabilities: HubProviderCapability[] = [
    { id: "media", kind: "media", origin: "real", support: "available" },
  ];

  return createProviderShell({
    metadata,
    capabilities,

    start(handle) {
      // Fetch the current state once so we don't wait for the next
      // change event before the bar knows about an already-playing
      // session.
      loadTauriMediaSessionStatus()
        .then((result) => {
          if (!result.ok || !result.status) {
            return;
          }
          const payload = statusToPayload(result.status);
          lastEmittedAvailable = payload.available;
          handle.emit([mediaPayloadToEvent(payload)]);
        })
        .catch(() => {
          // Initial fetch failed — non-critical, listener will catch
          // future changes. Don't markDegraded here: the GSMTC service
          // is allowed to be transiently unavailable on cold boot.
        });

      onMediaSessionChanged((payload) => {
        // Skip consecutive emissions that report the same availability
        // and no meaningful change (the Rust side coalesces a few of
        // these per second while a track plays).
        if (payload.available === lastEmittedAvailable) {
          return;
        }
        lastEmittedAvailable = payload.available;
        handle.emit([mediaPayloadToEvent(payload)]);
      })
        .then((unlistenFn) => {
          unlisten = unlistenFn;
        })
        .catch(() => {
          handle.markDegraded();
        });
    },

    stop() {
      unlisten?.();
      unlisten = undefined;
      lastEmittedAvailable = undefined;
    },
  });
}

// Re-export the polling fallback so consumers (tests, future stages)
// can drive the provider without the live Tauri bridge.
export const REAL_MEDIA_SESSION_FALLBACK_POLL_MS = POLL_FALLBACK_MS;
