import type { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  ExcalidrawScene,
} from "@sketchi/diagram-excalidraw";
import {
  buildScenarioPromptParts,
  evaluateScenarioFixture,
  evaluateScenarioOutput,
  flowchartScenarios,
  type DiagramScenario,
  type ScenarioEvaluation,
} from "@sketchi/diagram-scenarios";
import { Store, useStore } from "@tanstack/react-store";
import { useCallback, useMemo } from "react";

import { ExcalidrawSceneCanvas } from "../excalidraw-scene-canvas/index.js";
import { JsonCodeEditor } from "../json-code-editor/index.js";
import { PromptMessageViewer } from "../prompt-message-viewer/index.js";

export interface ScenarioPlaygroundProps {
  initialScenarioId?: string;
  scenarios?: readonly DiagramScenario[];
}

interface EvaluationState {
  error?: string;
  result?: ScenarioEvaluation;
}

type InspectorPanel = "candidate" | "prompt" | "excalidraw";

interface PlaygroundState {
  candidateText: string;
  editedExcalidrawScene: ExcalidrawScene | undefined;
  editedExcalidrawSceneSignature: string | undefined;
  inspectorPanel: InspectorPanel;
  scenarioId: string;
}

function evaluateCandidate(
  scenario: DiagramScenario,
  candidateText: string,
): EvaluationState {
  try {
    return {
      result: evaluateScenarioOutput(scenario, candidateText),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Candidate evaluation failed",
    };
  }
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function createInitialState(
  scenarios: readonly DiagramScenario[],
  initialScenarioId?: string,
): PlaygroundState {
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === initialScenarioId) ??
    scenarios[0];

  return {
    candidateText: selectedScenario
      ? formatJson(selectedScenario.expectedDiagram)
      : "{}",
    editedExcalidrawScene: undefined,
    editedExcalidrawSceneSignature: undefined,
    inspectorPanel: "candidate",
    scenarioId: selectedScenario?.id ?? "",
  };
}

function pickExcalidrawAppState(appState: Record<string, unknown>) {
  return {
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    selectedElementIds: appState.selectedElementIds,
    viewBackgroundColor: appState.viewBackgroundColor,
    zoom: appState.zoom,
  };
}

function sceneFromExcalidrawChange(
  elements: readonly unknown[],
  appState: Record<string, unknown>,
): ExcalidrawScene {
  return {
    appState: pickExcalidrawAppState(appState),
    elements: elements as ExcalidrawElement[],
  };
}

function sceneChangeSignature(
  elements: readonly unknown[],
  appState: Record<string, unknown>,
): string {
  return JSON.stringify({
    appState: pickExcalidrawAppState(appState),
    elements,
  });
}

export function ScenarioPlayground({
  initialScenarioId,
  scenarios = flowchartScenarios,
}: ScenarioPlaygroundProps) {
  const store = useMemo(
    () => new Store(createInitialState(scenarios, initialScenarioId)),
    [initialScenarioId, scenarios],
  );
  const state = useStore(store, (current) => current);
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === state.scenarioId) ??
    scenarios[0];

  const fixtureEvaluation = useMemo(
    () =>
      selectedScenario ? evaluateScenarioFixture(selectedScenario) : undefined,
    [selectedScenario],
  );
  const candidateEvaluation = useMemo(
    () =>
      selectedScenario
        ? evaluateCandidate(selectedScenario, state.candidateText)
        : undefined,
    [selectedScenario, state.candidateText],
  );
  const promptParts = selectedScenario
    ? buildScenarioPromptParts(selectedScenario)
    : undefined;
  const result = candidateEvaluation?.result ?? fixtureEvaluation;
  const checks = result?.checks ?? [];
  const displayedScene = state.editedExcalidrawScene ?? result?.excalidrawScene;
  const statusOk =
    Boolean(candidateEvaluation?.result?.ok) && !candidateEvaluation?.error;
  const inspectorTabs: Array<{ id: InspectorPanel; label: string }> = [
    { id: "candidate", label: "Candidate IR" },
    { id: "prompt", label: "Prompt" },
    { id: "excalidraw", label: "Excalidraw JSON" },
  ];

  function resetCandidate(nextScenario: DiagramScenario) {
    store.setState((current) => ({
      ...current,
      candidateText: formatJson(nextScenario.expectedDiagram),
      editedExcalidrawScene: undefined,
      editedExcalidrawSceneSignature: undefined,
      scenarioId: nextScenario.id,
    }));
  }

  const handleExcalidrawChange: NonNullable<ExcalidrawProps["onChange"]> =
    useCallback(
      (elements, appState) => {
        const typedAppState = appState as unknown as Record<string, unknown>;
        const signature = sceneChangeSignature(elements, typedAppState);

        store.setState((current) => {
          if (current.editedExcalidrawSceneSignature === signature) {
            return current;
          }

          return {
            ...current,
            editedExcalidrawScene: sceneFromExcalidrawChange(
              elements,
              typedAppState,
            ),
            editedExcalidrawSceneSignature: signature,
          };
        });
      },
      [store],
    );

  return (
    <section className="sketchi-scenario-playground">
      <header className="sketchi-scenario-playground__header">
        <div>
          <p className="sketchi-scenario-playground__eyebrow">Playground</p>
          <h1>Sketchi diagram scenarios</h1>
        </div>
        <span
          className={
            statusOk
              ? "sketchi-scenario-playground__status"
              : "sketchi-scenario-playground__status sketchi-scenario-playground__status--failed"
          }
        >
          {statusOk ? "Passing" : "Needs attention"}
        </span>
      </header>

      <div className="sketchi-scenario-playground__layout">
        <aside className="sketchi-scenario-playground__controls">
          <label>
            Scenario
            <select
              value={selectedScenario?.id}
              onChange={(event) => {
                const nextScenario = scenarios.find(
                  (scenario) => scenario.id === event.target.value,
                );
                if (nextScenario) {
                  resetCandidate(nextScenario);
                }
              }}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </select>
          </label>

          <section className="sketchi-scenario-playground__checks">
            <h2>Checks</h2>
            {candidateEvaluation?.error ? (
              <p className="sketchi-scenario-playground__error">
                {candidateEvaluation.error}
              </p>
            ) : null}
            <ul>
              {checks.map((check) => (
                <li key={check.id} data-pass={check.passed}>
                  <span>{check.passed ? "Pass" : "Fail"}</span>
                  {check.message}
                </li>
              ))}
            </ul>
          </section>

          {selectedScenario ? (
            <button
              type="button"
              onClick={() => resetCandidate(selectedScenario)}
            >
              Reset fixture
            </button>
          ) : null}
        </aside>

        <main className="sketchi-scenario-playground__main">
          {result ? (
            <ExcalidrawSceneCanvas
              onChange={handleExcalidrawChange}
              scene={result.excalidrawScene}
              title={result.diagram.title}
            />
          ) : null}
        </main>

        <aside className="sketchi-scenario-playground__inspector">
          <div
            aria-label="Inspector"
            className="sketchi-scenario-playground__tabs"
            role="tablist"
          >
            {inspectorTabs.map((tab) => (
              <button
                aria-selected={state.inspectorPanel === tab.id}
                key={tab.id}
                onClick={() =>
                  store.setState((current) => ({
                    ...current,
                    inspectorPanel: tab.id,
                  }))
                }
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {state.inspectorPanel === "candidate" ? (
            <JsonCodeEditor
              id="candidate-ir"
              label="Candidate IR"
              maxHeight="calc(100vh - 160px)"
              minHeight="calc(100vh - 214px)"
              onChange={(value) =>
                store.setState((current) => ({
                  ...current,
                  candidateText: value,
                  editedExcalidrawScene: undefined,
                  editedExcalidrawSceneSignature: undefined,
                }))
              }
              value={state.candidateText}
            />
          ) : null}

          {state.inspectorPanel === "prompt" ? (
            <PromptMessageViewer
              messages={promptParts?.messages ?? []}
              title="Prompt"
            />
          ) : null}

          {state.inspectorPanel === "excalidraw" ? (
            <JsonCodeEditor
              id="excalidraw-json"
              label="Excalidraw JSON"
              maxHeight="calc(100vh - 160px)"
              minHeight="calc(100vh - 214px)"
              readOnly
              value={formatJson(displayedScene ?? {})}
            />
          ) : null}
        </aside>
      </div>
    </section>
  );
}
