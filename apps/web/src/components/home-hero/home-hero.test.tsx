import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeHero } from "./home-hero";

describe("HomeHero", () => {
  it("renders the headline and primary actions", () => {
    render(<HomeHero />);

    expect(
      screen.getByRole("heading", { name: /validated diagrams/i }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open the app" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Read the docs" })).toBeTruthy();
  });

  it("labels the diagram illustration", () => {
    render(<HomeHero />);

    expect(
      screen.getByRole("img", {
        name: /validated, deterministic diagram/i,
      }),
    ).toBeTruthy();
  });
});
