import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHome } from "./marketing-home";

describe("MarketingHome", () => {
  it("composes the hero, pipeline, surfaces, and playground proof", () => {
    render(<MarketingHome previewImageSrc="/preview.png" />);

    expect(
      screen.getByRole("heading", { name: /validated diagrams/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Generation paths stay inspectable.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Four surfaces, one pipeline." }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Excalidraw workspace" }),
    ).toBeTruthy();
    expect(
      screen.getByAltText(
        "Sketchi playground showing a generated Excalidraw flowchart",
      ),
    ).toBeTruthy();
  });
});
