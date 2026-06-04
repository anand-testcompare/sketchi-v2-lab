import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JsonCodeEditor } from "./json-code-editor";

describe("JsonCodeEditor", () => {
  it("renders a labelled JSON editor", () => {
    render(
      <JsonCodeEditor
        label="Candidate IR"
        value={JSON.stringify({ type: "flowchart" }, null, 2)}
      />,
    );

    expect(screen.getByText("Candidate IR")).toBeTruthy();
    expect(screen.getByText(/flowchart/)).toBeTruthy();
  });
});
