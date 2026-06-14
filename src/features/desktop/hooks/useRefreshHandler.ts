import { useCallback } from "react";

import { emitTauriFixtureEvents, getTauriInvoke } from "@/runtime/tauriRuntime";

export type UseRefreshHandlerOptions = {
  isDraggingRef: React.RefObject<boolean>;
  refreshMetrics: () => Promise<void>;
  refreshRuntime: () => Promise<void>;
};

export function useRefreshHandler({
  isDraggingRef,
  refreshMetrics,
  refreshRuntime,
}: UseRefreshHandlerOptions) {
  return useCallback(async () => {
    if (isDraggingRef.current) {
      return;
    }

    const invoke = getTauriInvoke();
    if (invoke) {
      await emitTauriFixtureEvents({ invoke });
    }

    await Promise.all([refreshMetrics(), refreshRuntime()]);
  }, [refreshMetrics, refreshRuntime, isDraggingRef]);
}
