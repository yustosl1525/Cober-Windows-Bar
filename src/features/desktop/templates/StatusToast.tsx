import type { ReactNode } from "react";

type StatusToastProps = {
  children: ReactNode;
};

export function StatusToast({ children }: StatusToastProps) {
  return (
    <div className="product-status-toast" role="status" aria-live="polite">
      {children}
    </div>
  );
}
