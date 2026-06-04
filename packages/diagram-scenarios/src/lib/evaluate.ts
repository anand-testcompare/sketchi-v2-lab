import {
  type FlowchartDiagram,
  type IntermediateDiagram,
  parseFlowchartDiagram,
} from "@sketchi/diagram-core";
import {
  convertSceneToExcalidraw,
  validateExcalidrawScene,
  type ExcalidrawScene,
  type ExcalidrawSceneValidationResult,
} from "@sketchi/diagram-excalidraw";
import {
  renderIntermediateDiagram,
  type RenderedDiagramScene,
} from "@sketchi/diagram-renderer";

import type { DiagramScenario } from "./scenarios.js";

export interface ScenarioCheck {
  id: string;
  message: string;
  passed: boolean;
}

export interface ScenarioEvaluation {
  checks: ScenarioCheck[];
  diagram: IntermediateDiagram;
  excalidrawScene: ExcalidrawScene;
  excalidrawValidation: ExcalidrawSceneValidationResult;
  ok: boolean;
  scenarioId: string;
  scene: RenderedDiagramScene;
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function hasLabel(labels: readonly string[], expected: string): boolean {
  const normalized = normalizeLabel(expected);
  return labels.some((label) => normalizeLabel(label).includes(normalized));
}

function flowchartChecks(
  scenario: DiagramScenario,
  diagram: FlowchartDiagram,
): ScenarioCheck[] {
  const nodeLabels = diagram.nodes.map((node) => node.label);
  const branchLabels = diagram.edges
    .map((edge) => edge.label)
    .filter((label): label is string => Boolean(label));
  const nodeKinds = new Set(diagram.nodes.map((node) => node.kind));

  return [
    {
      id: "min-node-count",
      passed: diagram.nodes.length >= scenario.assertions.minNodeCount,
      message: `Expected at least ${scenario.assertions.minNodeCount} nodes.`,
    },
    {
      id: "min-edge-count",
      passed: diagram.edges.length >= scenario.assertions.minEdgeCount,
      message: `Expected at least ${scenario.assertions.minEdgeCount} edges.`,
    },
    ...scenario.assertions.requiredNodeKinds.map((kind) => ({
      id: `node-kind:${kind}`,
      passed: nodeKinds.has(kind),
      message: `Expected at least one ${kind} node.`,
    })),
    ...scenario.assertions.requiredNodeLabels.map((label) => ({
      id: `node-label:${label}`,
      passed: hasLabel(nodeLabels, label),
      message: `Expected a node label like "${label}".`,
    })),
    ...scenario.assertions.requiredBranchLabels.map((label) => ({
      id: `branch-label:${label}`,
      passed: hasLabel(branchLabels, label),
      message: `Expected a decision branch label like "${label}".`,
    })),
  ];
}

export function extractJsonCandidate(output: string): unknown {
  try {
    return JSON.parse(output);
  } catch {
    const firstBrace = output.indexOf("{");
    const lastBrace = output.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Model output did not contain a JSON object.");
    }

    return JSON.parse(output.slice(firstBrace, lastBrace + 1));
  }
}

export function evaluateScenarioDiagram(
  scenario: DiagramScenario,
  candidate: unknown,
): ScenarioEvaluation {
  const diagram = parseFlowchartDiagram(candidate);
  const scene = renderIntermediateDiagram(diagram);
  const excalidrawScene = convertSceneToExcalidraw(scene);
  const excalidrawValidation = validateExcalidrawScene(excalidrawScene);
  const checks = [
    ...flowchartChecks(scenario, diagram),
    {
      id: "excalidraw-scene",
      passed: excalidrawValidation.ok,
      message:
        excalidrawValidation.issues.length === 0
          ? "Excalidraw scene has bound arrows and fitting text."
          : `${excalidrawValidation.issues.length} Excalidraw validation issue(s).`,
    },
  ];

  return {
    checks,
    diagram,
    excalidrawScene,
    excalidrawValidation,
    ok: checks.every((check) => check.passed),
    scenarioId: scenario.id,
    scene,
  };
}

export function evaluateScenarioOutput(
  scenario: DiagramScenario,
  output: string,
): ScenarioEvaluation {
  return evaluateScenarioDiagram(scenario, extractJsonCandidate(output));
}

export function evaluateScenarioFixture(
  scenario: DiagramScenario,
): ScenarioEvaluation {
  return evaluateScenarioDiagram(scenario, scenario.expectedDiagram);
}
