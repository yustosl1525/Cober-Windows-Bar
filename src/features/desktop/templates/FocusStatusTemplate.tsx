import { MoonStar } from "lucide-react";
import { getDesktopStatusTemplateChromeCopy } from "../../../data/desktopStatusConfig";
import type { DesktopFocusState } from "../../../types/hub";
import { DesktopStatusTemplateFrame } from "./DesktopStatusTemplateFrame";

type FocusStatusTemplateProps = {
  state: DesktopFocusState;
};

export function FocusStatusTemplate({ state }: FocusStatusTemplateProps) {
  const copy = getDesktopStatusTemplateChromeCopy();

  return (
    <>
      <div className="product-status-icon" aria-hidden="true">
        <MoonStar size={33} strokeWidth={2.2} />
      </div>
      <DesktopStatusTemplateFrame eyebrow={copy.focusEyebrow} title={state.title} subtitle={state.subtitle}>
        <div className="product-status-template-meta">
          <span>{state.sessionLabel}</span>
          <span>{state.detail}</span>
        </div>
      </DesktopStatusTemplateFrame>
    </>
  );
}
