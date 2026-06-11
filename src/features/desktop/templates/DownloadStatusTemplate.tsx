import { Download } from "lucide-react";
import { getDesktopStatusTemplateChromeCopy } from "../../../data/desktopStatusConfig";
import type { DesktopDownloadState } from "../../../types/hub";
import { DesktopStatusTemplateFrame } from "./DesktopStatusTemplateFrame";
import { GuestSourceHealthIndicator } from "./GuestSourceHealthIndicator";
import { StatusRail } from "./StatusRail";

type DownloadStatusTemplateProps = {
  state: DesktopDownloadState;
};

export function DownloadStatusTemplate({ state }: DownloadStatusTemplateProps) {
  const copy = getDesktopStatusTemplateChromeCopy();

  return (
    <>
      <div className="product-status-icon product-status-icon-download" aria-hidden="true">
        <Download size={18} strokeWidth={2.1} />
        <GuestSourceHealthIndicator sourceHealth={state.sourceHealth} />
      </div>
      <DesktopStatusTemplateFrame
        eyebrow={copy.downloadEyebrow}
        title={state.title}
        subtitle={state.subtitle}
        meta={
          <>
            <span>{state.detail}</span>
            <span>{state.progress}%</span>
          </>
        }
      >
        <StatusRail value={state.progress} label={`${copy.downloadProgress} ${state.progress}%`} accent="green" />
      </DesktopStatusTemplateFrame>
    </>
  );
}
