import type { HubEvent } from "../types/hub";
import type { HubProvider, HubProviderCapability, HubProviderMetadata } from "./types";
import { createProviderShell } from "./providerShell";
import {
  onClipboardChanged,
  type ClipboardChangedPayload,
} from "../runtime/systemMonitorRuntime";

const PROVIDER_ID = "real-clipboard-provider";
const CLIPBOARD_DISPLAY_WINDOW_MS = 5_000;

function clipboardPayloadToEvent(payload: ClipboardChangedPayload): HubEvent {
  const createdAt = payload.copiedAt || Date.now();

  return {
    id: `${PROVIDER_ID}-clipboard-${createdAt}`,
    type: "clipboard",
    source: "clipboard",
    createdAt,
    expiresAt: createdAt + CLIPBOARD_DISPLAY_WINDOW_MS,
    payload: {
      text: payload.text,
      sourceApp: payload.sourceApp,
      copiedAt: payload.copiedAt,
    },
  };
}

export function createRealClipboardProvider(): HubProvider {
  // Track recently seen clipboard texts to avoid showing duplicates.
  // Bounded to MAX_SEEN_TEXTS entries to prevent unbounded memory growth.
  const MAX_SEEN_TEXTS = 50;
  const seenTexts: string[] = [];
  let unlisten: (() => void) | undefined;

  function hasSeenText(text: string): boolean {
    return seenTexts.includes(text);
  }

  function markTextSeen(text: string) {
    seenTexts.push(text);
    if (seenTexts.length > MAX_SEEN_TEXTS) {
      seenTexts.shift();
    }
  }

  const metadata: HubProviderMetadata = {
    id: PROVIDER_ID,
    name: "Clipboard Provider",
    kind: "clipboard",
    version: "1.0.0",
    mock: false,
  };

  const capabilities: HubProviderCapability[] = [
    { id: "clipboard", kind: "clipboard", origin: "real", support: "available" },
  ];

  return createProviderShell({
    metadata,
    capabilities,

    start(handle) {
      onClipboardChanged((payload) => {
        if (payload.text && hasSeenText(payload.text)) {
          return;
        }
        if (payload.text) {
          markTextSeen(payload.text);
        }
        handle.emit([clipboardPayloadToEvent(payload)]);
      }).then((unlistenFn) => {
        unlisten = unlistenFn;
      }).catch(() => {
        handle.markDegraded();
      });
    },

    stop() {
      unlisten?.();
      unlisten = undefined;
    },
  });
}
