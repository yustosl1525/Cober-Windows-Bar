import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FocusStatusTemplate } from "./FocusStatusTemplate";
import { mockFocusState } from "../../../test/fixtures";

describe("FocusStatusTemplate", () => {
  it("renders title, subtitle, session label, and detail", () => {
    const state = mockFocusState();
    render(<FocusStatusTemplate state={state} />);

    expect(screen.getByText("Focus Mode")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Deep work 25 min")).toBeInTheDocument();
    expect(screen.getByText("12 min remaining")).toBeInTheDocument();
  });

  it("shows the source health indicator with native quality", () => {
    const state = mockFocusState();
    render(<FocusStatusTemplate state={state} />);

    // quality: "native" → translates to "Native" in English
    expect(screen.getByText("Native")).toBeInTheDocument();
  });

  it("renders the eyebrow text", () => {
    const state = mockFocusState();
    const { container } = render(<FocusStatusTemplate state={state} />);

    const eyebrow = container.querySelector(".product-status-state-eyebrow");
    expect(eyebrow).toHaveTextContent("Focus");
  });

  it("reflects custom state overrides", () => {
    const state = mockFocusState({
      title: "Do Not Disturb",
      subtitle: "Windows Focus Assist",
      sessionLabel: "Priority only",
      detail: "Until 6:00 PM",
    });
    render(<FocusStatusTemplate state={state} />);

    expect(screen.getByText("Do Not Disturb")).toBeInTheDocument();
    expect(screen.getByText("Windows Focus Assist")).toBeInTheDocument();
    expect(screen.getByText("Priority only")).toBeInTheDocument();
    expect(screen.getByText("Until 6:00 PM")).toBeInTheDocument();
  });
});
