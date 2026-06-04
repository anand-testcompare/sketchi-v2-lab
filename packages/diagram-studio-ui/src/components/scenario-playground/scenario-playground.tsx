import {
  buildScenarioPrompt,
  evaluateScenarioFixture,
  evaluateScenarioOutput,
  flowchartScenarios,
  type DiagramScenario,
  type ScenarioEvaluation
} from "@sketchi/diagram-scenarios";
import { useMemo, useState } from "react";

import { ExcalidrawSceneCanvas } from "../excalidraw-scene-canvas/index.js";

export interface ScenarioPlaygroundProps {
  initialScenarioId?: string;
  scenarios?: readonly DiagramScenario[];
}

interface EvaluationState {
  error?: string;
  result?: ScenarioEvaluation;
}

function evaluateCandidate(
  scenario: DiagramScenario,
  candidateText: string
): EvaluationState {
  try {
    return {
      result: evaluateScenarioOutput(scenario, candidateText)
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Candidate evaluation failed"
    };
  }
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function ScenarioPlayground({
  initialScenarioId,
  scenarios = flowchartScenarios
}: ScenarioPlaygroundProps) {
  const [scenarioId, setScenarioId] = useState(
    initialScenarioId ?? scenarios[0]?.id ?? ""
  );
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];
  const [candidateText, setCandidateText] = useState(() =>
    selectedScenario ? formatJson(selectedScenario.expectedDiagram) : "{}"
  );

  const fixtureEvaluation = useMemo(
    () =>
      selectedScenario ? evaluateScenarioFixture(selectedScenario) : undefined,
    [selectedScenario]
  );
  const candidateEvaluation = useMemo(
    () =>
      selectedScenario
        ? evaluateCandidate(selectedScenario, candidateText)
        : undefined,
    [candidateText, selectedScenario]
  );
  const prompt = selectedScenario ? buildScenarioPrompt(selectedScenario) : "";
  const result = candidateEvaluation?.result ?? fixtureEvaluation;
  const checks = result?.checks ?? [];

  function resetCandidate(nextScenario: DiagramScenario) {
    setScenarioId(nextScenario.id);
    setCandidateText(formatJson(nextScenario.expectedDiagram));
  }

  return (
    <section className="sketchi-scenario-playground">
      <header className="sketchi-scenario-playground__header">
        <div>
          <p className="sketchi-scenario-playground__eyebrow">Playground</p>
          <h1>Sketchi diagram scenarios</h1>
        </div>
        <span
          className={
            result?.ok
              ? "sketchi-scenario-playground__status"
              : "sketchi-scenario-playground__status sketchi-scenario-playground__status--failed"
          }
        >
          {result?.ok ? "Passing" : "Needs attention"}
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
                  (scenario) => scenario.id === event.target.value
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

          {selectedScenario ? (
            <>
              <label>
                Prompt
                <textarea readOnly rows={12} value={prompt} />
              </label>
              <label>
                Candidate IR
                <textarea
                  rows={16}
                  value={candidateText}
                  onChange={(event) => setCandidateText(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => resetCandidate(selectedScenario)}
              >
                Reset fixture
              </button>
            </>
          ) : null}
        </aside>

        <main className="sketchi-scenario-playground__main">
          {result ? (
            <ExcalidrawSceneCanvas
              scene={result.excalidrawScene}
              title={result.diagram.title}
            />
          ) : null}

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

          <details className="sketchi-scenario-playground__json">
            <summary>Excalidraw JSON</summary>
            <pre>{formatJson(result?.excalidrawScene ?? {})}</pre>
          </details>
        </main>
      </div>
    </section>
  );
}
