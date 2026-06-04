import { createFileRoute } from "@tanstack/react-router";

import { ScenarioPlayground } from "@sketchi/diagram-studio-ui";
import "@sketchi/diagram-studio-ui/styles.css";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return <ScenarioPlayground />;
}
