import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClipboardStatusTemplate } from "./ClipboardStatusTemplate";
import { mockClipboardState } from "../../../test/fixtures";

vi.mock("../../../runtime/mediaControlRuntime", () => ({
  setClipboardContent: vi.fn().mockResolvedValue(true),
}));

describe("ClipboardStatusTemplate", () => {
  it("renders title, subtitle, and copied text", () => {
    const state = mockClipboardState();
    render(<ClipboardStatusTemplate state={state} />);

    expect(screen.getByText("Copied Content")).toBeInTheDocument();
    expect(screen.getByText("Clipboard Update")).toBeInTheDocument();
    expect(screen.getByText("https://github.com/example")).toBeInTheDocument();
    expect(screen.getByText("From browser")).toBeInTheDocument();
  });

  it("shows a Copy button", () => {
    const state = mockClipboardState();
    render(<ClipboardStatusTemplate state={state} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    expect(copyButton).toBeInTheDocument();
  });

  it("calls setClipboardContent when Copy is clicked", async () => {
    const { setClipboardContent } = await import("../../../runtime/mediaControlRuntime");
    const mockSet = vi.mocked(setClipboardContent);
    mockSet.mockClear();

    const state = mockClipboardState({ copiedText: "hello world" });
    render(<ClipboardStatusTemplate state={state} />);

    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(mockSet).toHaveBeenCalledWith("hello world");
  });

  it("shows source health indicator with app-owned quality", () => {
    const state = mockClipboardState();
    render(<ClipboardStatusTemplate state={state} />);

    expect(screen.getByText("App")).toBeInTheDocument();
  });
});
