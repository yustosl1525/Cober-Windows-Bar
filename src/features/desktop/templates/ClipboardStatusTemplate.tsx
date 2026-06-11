import { Clipboard, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { setClipboardContent } from "../../../runtime/mediaControlRuntime";
import type { DesktopClipboardState } from "../../../types/hub";
import { GuestSourceHealthIndicator } from "./GuestSourceHealthIndicator";

type ClipboardStatusTemplateProps = {
  state: DesktopClipboardState;
};

export function ClipboardStatusTemplate({ state }: ClipboardStatusTemplateProps) {
  const { t } = useTranslation();
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await setClipboardContent(state.copiedText);
    if (success) {
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 1500);
    }
  }, [state.copiedText]);

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

        <div className="product-status-metric" aria-label={state.detail}>
          <div className="product-status-label">
            <span className="product-status-label-name">{state.subtitle}</span>
          </div>
          <strong className="product-status-clipboard-source">{state.detail}</strong>
        </div>

        <div className="product-status-metric product-status-metric-clipboard-action">
          <button
            type="button"
            className={justCopied ? "product-status-clipboard-copy is-copied" : "product-status-clipboard-copy"}
            aria-label={justCopied ? t("common.copied") : t("clipboard.copyToClipboard")}
            onClick={() => void handleCopy()}
          >
            <Copy size={13} strokeWidth={2.2} />
            <span>{justCopied ? t("common.copied") : t("common.copy")}</span>
          </button>
        </div>
      </div>
    </>
  );
}
