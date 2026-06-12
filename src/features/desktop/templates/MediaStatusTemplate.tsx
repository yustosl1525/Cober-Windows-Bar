import { useCallback, useEffect, useState } from "react";
import { Disc3, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDesktopStatusTemplateChromeCopy } from "../../../data/desktopStatusConfig";
import { sendMediaControl, type MediaControlAction } from "../../../runtime/mediaControlRuntime";
import type { DesktopMediaState } from "../../../types/hub";
import { DesktopStatusTemplateFrame } from "./DesktopStatusTemplateFrame";
import { GuestSourceHealthIndicator } from "./GuestSourceHealthIndicator";
import { StatusRail } from "./StatusRail";

type MediaStatusTemplateProps = {
  state: DesktopMediaState;
};

export function MediaStatusTemplate({ state }: MediaStatusTemplateProps) {
  const { t } = useTranslation();
  const copy = getDesktopStatusTemplateChromeCopy();
  const isPlaying = state.playbackStatus === "playing";
  const isUnavailable = state.playbackStatus === "unavailable" || state.playbackStatus === "unsupported";
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleMediaAction = useCallback(
    async (action: MediaControlAction) => {
      const result = await sendMediaControl(action);
      if (result && !result.success) {
        setToast(t("media.controlFailed"));
      }
    },
    [t],
  );

  return (
    <>
      <div
        className={`product-status-icon product-status-icon-media${isPlaying ? " is-playing" : ""}`}
        aria-hidden="true"
      >
        <Disc3 size={20} strokeWidth={2.2} />
        <GuestSourceHealthIndicator sourceHealth={state.sourceHealth} />
      </div>
      <DesktopStatusTemplateFrame
        eyebrow={copy.mediaEyebrow}
        title={state.title}
        subtitle={state.subtitle}
        meta={
          isUnavailable ? (
            <span className="product-status-media-unavailable-badge">
              {t("media.unavailable.badge")}
            </span>
          ) : (
            <>
              <span>
                {isPlaying ? <MediaVisualizer /> : null}
                {state.artist}
              </span>
              <span>{state.timeLabel}</span>
            </>
          )
        }
      >
        <StatusRail
          value={state.progress}
          label={`${copy.mediaProgress} ${state.progress}%`}
          accent="violet"
          active={isPlaying}
          shimmer
        />
        <div className="product-status-guest-controls">
          <button
            type="button"
            className="product-status-guest-btn"
            aria-label={t("media.previous")}
            title={t("media.previous")}
            disabled={isUnavailable}
            onClick={() => void handleMediaAction("previous")}
          >
            <SkipBack size={14} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="product-status-guest-btn product-status-guest-btn-primary"
            aria-label={isPlaying ? t("media.pause") : t("media.play")}
            aria-pressed={isPlaying}
            title={isPlaying ? t("media.pause") : t("media.play")}
            disabled={isUnavailable}
            onClick={() => void handleMediaAction("play-pause")}
          >
            {isPlaying ? (
              <Pause size={14} strokeWidth={2.4} />
            ) : (
              <Play size={14} strokeWidth={2.4} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            className="product-status-guest-btn"
            aria-label={t("media.next")}
            title={t("media.next")}
            disabled={isUnavailable}
            onClick={() => void handleMediaAction("next")}
          >
            <SkipForward size={14} strokeWidth={2.4} />
          </button>
        </div>
      </DesktopStatusTemplateFrame>
      {toast ? (
        <div className="product-status-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </>
  );
}

function MediaVisualizer() {
  return (
    <span className="product-status-media-visualizer" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
