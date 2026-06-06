import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHome } from "./marketing-home";

describe("MarketingHome", () => {
  it("renders the product home and docs anchors", () => {
    render(<MarketingHome previewImageSrc="/preview.png" />);

    expect(screen.getByRole("heading", { name: "Sketchi" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Read docs" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Docs" })).toBeTruthy();
    expect(
      screen.getByAltText(
        "Sketchi playground showing a generated Excalidraw flowchart",
      ),
    ).toBeTruthy();
  });
});
