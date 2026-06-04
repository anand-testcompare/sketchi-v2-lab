import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@excalidraw/excalidraw", () => ({
  Excalidraw: ({
    onChange,
  }: {
    onChange?: (
      elements: readonly Record<string, unknown>[],
      appState: Record<string, unknown>,
    ) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onChange?.(
          [
            {
              height: 72,
              id: "node:draft",
              type: "rectangle",
              width: 184,
              x: 123,
              y: 456,
            },
          ],
          {
            scrollX: 1,
            scrollY: 2,
            selectedElementIds: { "node:draft": true },
            viewBackgroundColor: "#ffffff",
            zoom: { value: 0.62 },
          },
        )
      }
    >
      Mock visual edit
    </button>
  ),
}));

vi.mock("../json-code-editor/index.js", () => ({
  JsonCodeEditor: ({
    label,
    onChange,
    readOnly,
    value,
  }: {
    label: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    value: string;
  }) => (
    <label>
      {label}
      <textarea
        aria-label={label}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  ),
}));

import { ScenarioPlayground } from "./scenario-playground";

describe("ScenarioPlayground", () => {
  it("renders maintained scenarios and their checks", () => {
    render(<ScenarioPlayground />);

    expect(
      screen.getByRole("heading", { name: "Sketchi diagram scenarios" }),
    ).toBeTruthy();
    expect(screen.getByText("Expected at least 5 nodes.")).toBeTruthy();
    expect(screen.getByLabelText("Candidate IR")).toBeTruthy();
  });

  it("reports invalid candidate output", () => {
    render(<ScenarioPlayground />);

    fireEvent.change(screen.getByLabelText("Candidate IR"), {
      target: { value: "not json" },
    });

    expect(
      screen.getByText("Model output did not contain a JSON object."),
    ).toBeTruthy();
  });

  it("mirrors Excalidraw visual edits into the JSON inspector", async () => {
    render(<ScenarioPlayground />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Mock visual edit" }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Excalidraw JSON" }));

    const excalidrawJson = screen.getByLabelText(
      "Excalidraw JSON",
    ) as HTMLTextAreaElement;

    expect(excalidrawJson.value).toContain('"node:draft": true');
    expect(excalidrawJson.value).toContain('"x": 123');
  });
});
