import { Clipboard } from "lucide-react";
import { getDesktopStatusTemplateChromeCopy } from "../../../data/desktopStatusConfig";
import type { DesktopClipboardState } from "../../../types/hub";
import { DesktopStatusTemplateFrame } from "./DesktopStatusTemplateFrame";

type ClipboardStatusTemplateProps = {
  state: DesktopClipboardState;
};

export function ClipboardStatusTemplate({ state }: ClipboardStatusTemplateProps) {
  const copy = getDesktopStatusTemplateChromeCopy();

  return (
    <>
      <div className="product-status-icon" aria-hidden="true">
        <Clipboard size={33} strokeWidth={2.2} />
      </div>
      <DesktopStatusTemplateFrame eyebrow={copy.clipboardEyebrow} title={state.title} subtitle={state.subtitle}>
        <div className="product-status-template-meta">
          <span>{state.copiedText}</span>
          <span>{state.detail}</span>
        </div>
      </DesktopStatusTemplateFrame>
    </>
  );
}
