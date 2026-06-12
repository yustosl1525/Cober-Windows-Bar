import { useEffect, useState } from "react";

/**
 * How long the inline toast stays visible before auto-clearing. Matches
 * the CSS `@keyframes product-status-toast-flash` duration so the JS
 * timer and the fade-out animation stay in lockstep.
 */
export const STATUS_TOAST_DURATION_MS = 1_600;

export type StatusToast = {
  toast: string | null;
  showToast: (message: string) => void;
};

export function useStatusToast(): StatusToast {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), STATUS_TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return { toast, showToast: setToast };
}
