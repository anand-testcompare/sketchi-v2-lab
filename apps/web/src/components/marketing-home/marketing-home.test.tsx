import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHome } from "./marketing-home";

describe("MarketingHome", () => {
  it("composes the hero, pipeline, and surfaces", () => {
    render(<MarketingHome />);

    expect(
      screen.getByRole("heading", { name: /validated diagrams/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Generation stays inspectable." }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Four surfaces, one pipeline." }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Excalidraw workspace" }),
    ).toBeTruthy();
  });
});
