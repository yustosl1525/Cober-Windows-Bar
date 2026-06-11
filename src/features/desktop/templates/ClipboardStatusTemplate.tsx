import { Clipboard, ExternalLink } from "lucide-react";
import { useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { DesktopClipboardState } from "../../../types/hub";
import { GuestSourceHealthIndicator } from "./GuestSourceHealthIndicator";

type ClipboardStatusTemplateProps = {
  state: DesktopClipboardState;
};

function detectUrl(text: string): string | null {
  // Remove ellipsis that may have been added by preview truncation
  const cleaned = text.replace(/\u2026$/, "").trim();
  try {
    const url = new URL(cleaned);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    // not a URL
  }
  return null;
}

export function ClipboardStatusTemplate({ state }: ClipboardStatusTemplateProps) {
  const url = useMemo(() => detectUrl(state.copiedText), [state.copiedText]);

  const handleOpenUrl = useCallback(async () => {
    if (!url) return;
    try {
      await invoke("open_url_in_browser", { url });
    } catch (e) {
      console.error("Failed to open URL:", e);
    }
  }, [url]);

  return (
    <>
      <div className="product-status-icon product-status-icon-clipboard" aria-hidden="true">
        <Clipboard size={20} strokeWidth={2.2} />
        <GuestSourceHealthIndicator sourceHealth={state.sourceHealth} />
      </div>

      <div className="product-status-metrics">
        <div className="product-status-metric" aria-label={state.copiedText} title={state.copiedText}>
          <div className="product-status-label">
            <span className="product-status-label-name">{state.title}</span>
          </div>
          <span className="product-status-clipboard-text">{state.copiedText}</span>
        </div>

        {url ? (
          <div className="product-status-metric product-status-metric-clipboard-action">
            <button
              type="button"
              className="product-status-clipboard-open"
              aria-label="Open in browser"
              onClick={() => void handleOpenUrl()}
            >
              <ExternalLink size={13} strokeWidth={2.2} />
              <span>打开</span>
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
