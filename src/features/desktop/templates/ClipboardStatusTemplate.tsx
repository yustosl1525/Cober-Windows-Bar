import { Clipboard, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getDesktopStatusTemplateChromeCopy } from "../../../data/desktopStatusConfig";
import { setClipboardContent } from "../../../runtime/mediaControlRuntime";
import type { DesktopClipboardState } from "../../../types/hub";
import { DesktopStatusTemplateFrame } from "./DesktopStatusTemplateFrame";
import { GuestSourceHealthIndicator } from "./GuestSourceHealthIndicator";

type ClipboardStatusTemplateProps = {
  state: DesktopClipboardState;
};

export function ClipboardStatusTemplate({ state }: ClipboardStatusTemplateProps) {
  const { t } = useTranslation();
  const copy = getDesktopStatusTemplateChromeCopy();
  const [justCopied, setJustCopied] = useState(false);

  async function handleCopy() {
    const success = await setClipboardContent(state.copiedText);
    if (success) {
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 1500);
    }
  }

  return (
    <>
      <div className="product-status-icon product-status-icon-clipboard" aria-hidden="true">
        <Clipboard size={18} strokeWidth={2.1} />
        <GuestSourceHealthIndicator sourceHealth={state.sourceHealth} />
      </div>
      <DesktopStatusTemplateFrame
        eyebrow={copy.clipboardEyebrow}
        title={state.title}
        subtitle={state.subtitle}
        meta={
          <>
            <span>{state.copiedText}</span>
            <span>{state.detail}</span>
          </>
        }
      >
        <button
          type="button"
          className={justCopied ? "product-status-clipboard-copy is-copied" : "product-status-clipboard-copy"}
          aria-label={justCopied ? t("common.copied") : t("clipboard.copyToClipboard")}
          onClick={() => void handleCopy()}
        >
          <Copy size={13} strokeWidth={2.2} />
          <span>{justCopied ? t("common.copied") : t("common.copy")}</span>
        </button>
      </DesktopStatusTemplateFrame>
    </>
  );
}
