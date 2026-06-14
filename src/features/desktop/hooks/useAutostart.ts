import { useCallback, useEffect, useState } from "react";

import {
  getAutostartEnabled,
  setAutostartEnabled as applyAutostart,
} from "@/runtime/autostartRuntime";

export type UseAutostartResult = {
  autostartEnabled: boolean;
  toggleAutostart: () => Promise<void>;
};

export function useAutostart(): UseAutostartResult {
  const [autostartEnabled, setAutostartEnabled] = useState(false);

  useEffect(() => {
    void getAutostartEnabled().then(setAutostartEnabled);
  }, []);

  const toggleAutostart = useCallback(async () => {
    const nextValue = !autostartEnabled;
    const success = await applyAutostart(nextValue);
    if (success) {
      setAutostartEnabled(nextValue);
    }
  }, [autostartEnabled]);

  return { autostartEnabled, toggleAutostart };
}
