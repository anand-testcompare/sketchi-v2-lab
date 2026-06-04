import { describe, expect, it } from "vitest";

import {
  flowchartFixture,
  pharmaBatchDispositionFlowchart,
} from "@sketchi/diagram-core";
import { renderIntermediateDiagram } from "@sketchi/diagram-renderer";

import {
  convertSceneToExcalidraw,
  validateExcalidrawScene,
} from "./diagram-excalidraw";

describe("convertSceneToExcalidraw", () => {
  it("creates bound arrows that validate as real Excalidraw elements", () => {
    const scene = convertSceneToExcalidraw(
      renderIntermediateDiagram(flowchartFixture),
    );
    const branchArrow = scene.elements.find(
      (element) => element.id === "edge:clear-draft",
    );

    const validation = validateExcalidrawScene(scene);

    expect(validation).toEqual({ ok: true, issues: [] });
    expect(scene.appState).toMatchObject({
      viewBackgroundColor: "#ffffff",
      zoom: {
        value: expect.any(Number),
      },
    });
    expect(
      scene.elements.filter((element) => element.type === "arrow"),
    ).toHaveLength(flowchartFixture.edges.length);
    expect(branchArrow).toMatchObject({
      type: "arrow",
      points: expect.arrayContaining([
        expect.any(Array),
        expect.any(Array),
        expect.any(Array),
      ]),
    });
  });

  it("keeps wrapped flowchart text inside real shape containers", () => {
    const scene = convertSceneToExcalidraw(
      renderIntermediateDiagram(pharmaBatchDispositionFlowchart),
    );

    const validation = validateExcalidrawScene(scene);
    const qaText = scene.elements.find(
      (element) => element.id === "label:qa-review",
    );

    expect(validation).toEqual({ ok: true, issues: [] });
    expect(qaText).toMatchObject({
      type: "text",
      containerId: "node:qa-review",
      text: expect.stringContaining("\n"),
    });
  });

  it("keeps maintained flowchart arrow routes from overlapping", () => {
    const maintainedScenes = [
      flowchartFixture,
      pharmaBatchDispositionFlowchart,
    ].map((diagram) =>
      convertSceneToExcalidraw(renderIntermediateDiagram(diagram)),
    );

    for (const scene of maintainedScenes) {
      expect(validateExcalidrawScene(scene).issues).not.toContainEqual(
        expect.objectContaining({ code: "overlapping-arrow-segment" }),
      );
    }
  });

  it("reports broken reciprocal arrow bindings", () => {
    const scene = convertSceneToExcalidraw(
      renderIntermediateDiagram(flowchartFixture),
    );
    const firstShape = scene.elements.find(
      (element) => element.id === "node:prompt",
    );

    if (firstShape) {
      firstShape.boundElements = [];
    }

    expect(validateExcalidrawScene(scene)).toMatchObject({
      ok: false,
      issues: [
        {
          code: "missing-bound-arrow",
          elementId: "node:prompt",
        },
      ],
    });
  });

  it("reports overlapping arrow route segments", () => {
    const scene = convertSceneToExcalidraw(
      renderIntermediateDiagram(flowchartFixture),
    );
    const promptArrow = scene.elements.find(
      (element) => element.id === "edge:prompt-requirements",
    );
    const requirementsArrow = scene.elements.find(
      (element) => element.id === "edge:requirements-clear",
    );

    if (promptArrow && requirementsArrow) {
      requirementsArrow.x = promptArrow.x;
      requirementsArrow.y = promptArrow.y;
      requirementsArrow.points = promptArrow.points;
    }

    expect(validateExcalidrawScene(scene)).toMatchObject({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "overlapping-arrow-segment",
          elementId: "edge:prompt-requirements",
        }),
      ],
    });
  });
});
