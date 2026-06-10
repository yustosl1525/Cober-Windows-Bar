import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UpdateStatusTemplate } from "./UpdateStatusTemplate";
import { mockUpdateState } from "../../../test/fixtures";

describe("UpdateStatusTemplate", () => {
  it("renders title, subtitle, and detail", () => {
    const state = mockUpdateState();
    render(<UpdateStatusTemplate state={state} />);

    expect(screen.getByText("System Update")).toBeInTheDocument();
    expect(screen.getByText("Ready to Restart")).toBeInTheDocument();
    expect(screen.getByText("KB5039302")).toBeInTheDocument();
  });

  it("shows the source health indicator with fixture quality", () => {
    const state = mockUpdateState();
    render(<UpdateStatusTemplate state={state} />);

    // quality: "fixture" → translates to "Fixture" in English
    expect(screen.getByText("Fixture")).toBeInTheDocument();
  });

  it("renders the eyebrow text", () => {
    const state = mockUpdateState();
    const { container } = render(<UpdateStatusTemplate state={state} />);

    const eyebrow = container.querySelector(".product-status-state-eyebrow");
    expect(eyebrow).toHaveTextContent("Update");
  });
});
