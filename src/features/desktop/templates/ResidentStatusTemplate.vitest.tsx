import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResidentStatusTemplate } from "./ResidentStatusTemplate";
import { mockResidentState } from "../../../test/fixtures";

describe("ResidentStatusTemplate", () => {
  it("renders three metric bars with correct labels", () => {
    const state = mockResidentState();
    render(<ResidentStatusTemplate state={state} />);

    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(3);

    // Each metric should show its label and value
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("Memory")).toBeInTheDocument();
    expect(screen.getByText("61%")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("17%")).toBeInTheDocument();
  });

  it("shows the source quality indicator", () => {
    const state = mockResidentState({ sourceStatus: { quality: "live" } });
    render(<ResidentStatusTemplate state={state} />);

    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("falls back to Fallback label when quality is undefined", () => {
    const state = mockResidentState({ sourceStatus: undefined });
    render(<ResidentStatusTemplate state={state} />);

    expect(screen.getByText("Fallback")).toBeInTheDocument();
  });

  it("renders progressbar with correct aria-valuenow", () => {
    const state = mockResidentState();
    render(<ResidentStatusTemplate state={state} />);

    const cpuBar = screen.getAllByRole("progressbar")[0];
    expect(cpuBar).toHaveAttribute("aria-valuenow", "42");
    expect(cpuBar).toHaveAttribute("aria-valuemin", "0");
    expect(cpuBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("applies correct CSS class for source quality", () => {
    const state = mockResidentState({ sourceStatus: { quality: "stale" } });
    const { container } = render(<ResidentStatusTemplate state={state} />);

    const indicator = container.querySelector(".product-status-source-health");
    expect(indicator).toHaveClass("is-stale");
  });
});
