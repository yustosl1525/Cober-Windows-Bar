import { RefreshCw } from "lucide-react";
import { getDesktopStatusTemplateChromeCopy } from "../../../data/desktopStatusConfig";
import type { DesktopUpdateState } from "../../../types/hub";
import { DesktopStatusTemplateFrame } from "./DesktopStatusTemplateFrame";

type UpdateStatusTemplateProps = {
  state: DesktopUpdateState;
};

export function UpdateStatusTemplate({ state }: UpdateStatusTemplateProps) {
  const copy = getDesktopStatusTemplateChromeCopy();

  return (
    <>
      <div className="product-status-icon product-status-icon-update" aria-hidden="true">
        <RefreshCw size={18} strokeWidth={2.1} />
      </div>
      <DesktopStatusTemplateFrame
        eyebrow={copy.updateEyebrow}
        title={state.title}
        subtitle={state.subtitle}
        meta={
          <>
            <span>{state.detail}</span>
            <span>{state.progress}%</span>
          </>
        }
      >
        <StatusRail value={state.progress} label={`${copy.updateProgress} ${state.progress}%`} accent="orange" />
      </DesktopStatusTemplateFrame>
    </>
  );
}

function StatusRail({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: "orange";
}) {
  return (
    <span
      className={`product-status-track product-status-track-${accent}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${Math.max(12, Math.min(100, value))}%` }} />
    </span>
  );
}
