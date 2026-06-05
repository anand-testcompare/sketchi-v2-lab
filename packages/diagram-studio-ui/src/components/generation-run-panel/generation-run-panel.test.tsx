import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GenerationRunPanel } from "./generation-run-panel";

describe("GenerationRunPanel", () => {
  it("renders the title", () => {
    render(<GenerationRunPanel title="Generated component" />);

    expect(
      screen.getByRole("heading", { name: "Generated component" }),
    ).toBeTruthy();
  });

  it("runs the comparison action", () => {
    const onRun = vi.fn();

    render(<GenerationRunPanel onRun={onRun} />);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("shows provider candidate status", () => {
    render(
      <GenerationRunPanel
        candidates={[
          {
            diagnostics: [],
            diagramValid: false,
            durationMs: 42,
            model: "google/gemini-3.1-flash-lite",
            provider: "cloudflare-workers-ai",
            text: "{}",
            usage: { totalTokens: 11 },
          },
          {
            diagnostics: ["bad json", "AI Gateway compat request failed."],
            diagramValid: false,
            error: "bad json",
            model: "google/gemini-3.1-flash-lite",
            provider: "cloudflare-ai-gateway-compat",
            text: "",
          },
        ]}
      />,
    );

    expect(screen.getByText("Returned")).toBeTruthy();
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("AI Gateway compat request failed.")).toBeTruthy();
    expect(screen.getByText("42 ms / 11 tokens")).toBeTruthy();
  });
});
