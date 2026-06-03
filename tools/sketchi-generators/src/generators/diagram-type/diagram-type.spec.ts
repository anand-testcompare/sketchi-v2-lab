import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import type { Tree } from "@nx/devkit";

import { diagramTypeGenerator } from "./diagram-type";
import type { DiagramTypeGeneratorSchema } from "./schema";

describe("diagram-type generator", () => {
  let tree: Tree;
  const options: DiagramTypeGeneratorSchema = {
    name: "mindmap",
    title: "Generated mindmap",
    skipFormat: true
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(
      "packages/diagram-core/src/diagram-types.ts",
      `export const DIAGRAM_TYPES = [
  "architecture",
  "flowchart"
] as const;
`
    );
    tree.write("packages/diagram-core/src/index.ts", "");
  });

  it("creates diagram fixtures, renderer contract, Storybook story, and registry export", async () => {
    await diagramTypeGenerator(tree, options);

    expect(tree.read("packages/diagram-core/src/diagram-types.ts", "utf-8"))
      .toContain('"mindmap"');
    expect(
      tree.exists("packages/diagram-core/src/diagram-types/mindmap.ts")
    ).toBe(true);
    expect(
      tree.exists("packages/diagram-renderer/src/diagram-types/mindmap.test.ts")
    ).toBe(true);
    expect(
      tree.exists(
        "packages/diagram-studio-ui/src/diagram-types/mindmap.stories.tsx"
      )
    ).toBe(true);
    expect(tree.read("packages/diagram-core/src/index.ts", "utf-8")).toContain(
      'export * from "./diagram-types/mindmap";'
    );
  });
});
