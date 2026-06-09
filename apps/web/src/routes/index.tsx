import { createFileRoute } from "@tanstack/react-router";

import { MarketingHome } from "../components/marketing-home/index.js";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return <MarketingHome />;
}
