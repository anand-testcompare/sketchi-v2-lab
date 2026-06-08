import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SketchiIcon } from "../../lib/icon-data";
import { IconDetail } from "./icon-detail";

const icon: SketchiIcon = {
  bytes: 1901,
  collection: "auth-identity",
  fileName: "workos.svg",
  flags: ["duplicate-raster"],
  id: "auth-identity:workos",
  slug: "workos",
  urlPath: "/output/upload-ready/svg/auth-identity/workos.svg",
  viewBox: { height: 512, minX: 0, minY: 0, width: 512 },
};

describe("IconDetail", () => {
  it("renders metadata, flags, and copy/download actions", () => {
    render(<IconDetail icon={icon} />);

    expect(screen.getByRole("heading", { name: "workos" })).toBeTruthy();
    expect(screen.getByText("workos.svg")).toBeTruthy();
    expect(screen.getByText("512×512")).toBeTruthy();
    expect(screen.getByText("duplicate-raster")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy SVG" })).toBeTruthy();

    const download = screen.getByRole("link", { name: "Download" });
    expect(download.getAttribute("href")).toBe(icon.urlPath);
    expect(download.getAttribute("download")).toBe("workos.svg");
  });
});
