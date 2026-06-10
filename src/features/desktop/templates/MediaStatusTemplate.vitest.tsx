import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MediaStatusTemplate } from "./MediaStatusTemplate";
import { mockMediaState } from "../../../test/fixtures";

vi.mock("../../../runtime/mediaControlRuntime", () => ({
  sendMediaControl: vi.fn().mockResolvedValue({ success: true }),
}));

describe("MediaStatusTemplate", () => {
  it("renders title, subtitle, artist, and time label", () => {
    const state = mockMediaState();
    render(<MediaStatusTemplate state={state} />);

    expect(screen.getByText("Neon Focus")).toBeInTheDocument();
    expect(screen.getByText("Now Playing")).toBeInTheDocument();
    expect(screen.getByText("Cober Player")).toBeInTheDocument();
    expect(screen.getByText("01:42 / 03:28")).toBeInTheDocument();
  });

  it("renders three media control buttons", () => {
    const state = mockMediaState();
    render(<MediaStatusTemplate state={state} />);

    expect(screen.getByLabelText("Previous")).toBeInTheDocument();
    expect(screen.getByLabelText("Play/Pause")).toBeInTheDocument();
    expect(screen.getByLabelText("Next")).toBeInTheDocument();
  });

  it("renders a progress bar with correct value", () => {
    const state = mockMediaState({ progress: 65 });
    render(<MediaStatusTemplate state={state} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "65");
  });

  it("calls sendMediaControl when control buttons are clicked", async () => {
    const { sendMediaControl } = await import("../../../runtime/mediaControlRuntime");
    const mockSend = vi.mocked(sendMediaControl);
    mockSend.mockClear();

    const state = mockMediaState();
    render(<MediaStatusTemplate state={state} />);

    fireEvent.click(screen.getByLabelText("Play/Pause"));
    expect(mockSend).toHaveBeenCalledWith("play-pause");

    fireEvent.click(screen.getByLabelText("Previous"));
    expect(mockSend).toHaveBeenCalledWith("previous");

    fireEvent.click(screen.getByLabelText("Next"));
    expect(mockSend).toHaveBeenCalledWith("next");
  });

  it("shows the source health indicator", () => {
    const state = mockMediaState();
    render(<MediaStatusTemplate state={state} />);

    expect(screen.getByText("Native")).toBeInTheDocument();
  });
});
