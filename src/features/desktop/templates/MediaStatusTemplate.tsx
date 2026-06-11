import { useCallback } from "react";
import { Music4, Pause, Play, SkipBack, SkipForward } from "lucide-react";
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

  const handleMediaAction = useCallback(async (action: MediaControlAction) => {
    await sendMediaControl(action);
  }, []);

  return (
    <>
      <div className="product-status-icon product-status-icon-media" aria-hidden="true">
        <Music4 size={18} strokeWidth={2.1} />
        <GuestSourceHealthIndicator sourceHealth={state.sourceHealth} />
      </div>
      <DesktopStatusTemplateFrame
        eyebrow={copy.mediaEyebrow}
        title={state.title}
        subtitle={state.subtitle}
        meta={
          <>
            <span>{state.artist}</span>
            <span>{state.timeLabel}</span>
          </>
        }
      >
        <StatusRail value={state.progress} label={`${copy.mediaProgress} ${state.progress}%`} accent="violet" />
        <div className="product-status-media-controls">
          <button
            type="button"
            className="product-status-media-btn"
            aria-label={t("media.previous")}
            onClick={() => void handleMediaAction("previous")}
          >
            <SkipBack size={14} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="product-status-media-btn product-status-media-btn-primary"
            aria-label={isPlaying ? t("media.pause") : t("media.play")}
            onClick={() => void handleMediaAction("play-pause")}
          >
            {isPlaying ? (
              <Pause size={15} strokeWidth={2.4} />
            ) : (
              <Play size={16} strokeWidth={2.4} />
            )}
          </button>
          <button
            type="button"
            className="product-status-media-btn"
            aria-label={t("media.next")}
            onClick={() => void handleMediaAction("next")}
          >
            <SkipForward size={14} strokeWidth={2.2} />
          </button>
        </div>
      </DesktopStatusTemplateFrame>
    </>
  );
}
