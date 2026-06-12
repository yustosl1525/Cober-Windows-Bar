import { Bell, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDesktopStatusTemplateChromeCopy } from "../../../data/desktopStatusConfig";
import { dismissNotification } from "../../../runtime/notificationDismissRuntime";
import type { DesktopNotificationState } from "../../../types/hub";
import { DesktopStatusTemplateFrame } from "./DesktopStatusTemplateFrame";
import { GuestSourceHealthIndicator } from "./GuestSourceHealthIndicator";

type NotificationStatusTemplateProps = {
  state: DesktopNotificationState;
};

export function NotificationStatusTemplate({ state }: NotificationStatusTemplateProps) {
  const { t } = useTranslation();
  const copy = getDesktopStatusTemplateChromeCopy();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleDismiss = useCallback(async () => {
    const result = await dismissNotification();
    if (result && !result.success) {
      setToast(t("notification.dismissFailed"));
    }
  }, [t]);

  return (
    <>
      <div className="product-status-icon product-status-icon-notification" aria-hidden="true">
        <Bell size={20} strokeWidth={2.2} />
        <GuestSourceHealthIndicator sourceHealth={state.sourceHealth} />
      </div>
      <DesktopStatusTemplateFrame
        eyebrow={copy.notificationEyebrow}
        title={state.title}
        subtitle={state.subtitle}
        meta={
          <span className="product-status-template-meta-actions">
            <span>
              <span>{state.sender}</span>
              <span>{state.message}</span>
            </span>
            <button
              type="button"
              className="product-status-guest-btn product-status-guest-btn-primary"
              aria-label={t("notification.dismiss")}
              title={t("notification.dismiss")}
              onClick={() => void handleDismiss()}
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </span>
        }
      />
      {toast ? (
        <div className="product-status-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </>
  );
}
