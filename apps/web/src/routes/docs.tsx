import { createFileRoute } from "@tanstack/react-router";

import { DocsView } from "../components/docs-view/index.js";
import { SiteFooter } from "../components/site-footer/index.js";
import { SiteHeader } from "../components/site-header/index.js";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [{ title: "Docs — Sketchi" }],
  }),
  component: DocsRoute,
});

function DocsRoute() {
  return (
    <div className="sketchi-web">
      <SiteHeader activePath="/docs" />
      <main>
        <DocsView />
      </main>
      <SiteFooter />
    </div>
  );
}
