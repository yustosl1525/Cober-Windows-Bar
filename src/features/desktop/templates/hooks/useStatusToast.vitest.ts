import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { STATUS_TOAST_DURATION_MS, useStatusToast } from "./useStatusToast";

describe("useStatusToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts with no toast and ignores showToast when nothing is visible", () => {
    const { result } = renderHook(() => useStatusToast());
    expect(result.current.toast).toBeNull();
  });

  it("stores the message and auto-clears after the CSS-aligned duration", () => {
    const { result } = renderHook(() => useStatusToast());

    act(() => {
      result.current.showToast("something went wrong");
    });
    expect(result.current.toast).toBe("something went wrong");

    act(() => {
      vi.advanceTimersByTime(STATUS_TOAST_DURATION_MS - 1);
    });
    expect(result.current.toast).toBe("something went wrong");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toast).toBeNull();
  });

  it("replaces the previous message when a new toast is shown before the timer fires", () => {
    const { result } = renderHook(() => useStatusToast());

    act(() => {
      result.current.showToast("first");
    });
    act(() => {
      vi.advanceTimersByTime(STATUS_TOAST_DURATION_MS / 2);
    });

    act(() => {
      result.current.showToast("second");
    });
    expect(result.current.toast).toBe("second");

    act(() => {
      vi.advanceTimersByTime(STATUS_TOAST_DURATION_MS);
    });
    expect(result.current.toast).toBeNull();
  });
});
