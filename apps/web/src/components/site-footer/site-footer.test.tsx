import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("renders the footer columns and colophon", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("heading", { name: "Product" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Surfaces" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Project" })).toBeTruthy();
    expect(
      screen.getByText("Sketchi v2 — typed diagram generation"),
    ).toBeTruthy();
  });
});
