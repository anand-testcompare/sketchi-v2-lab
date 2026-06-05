export interface ScenarioSuitePanelScenario {
  difficulty?: string;
  id: string;
  title: string;
}

export interface ScenarioSuitePanelResult {
  durationMs?: number;
  message: string;
  scenarioId: string;
  status: "fail" | "pass" | "running";
  title: string;
}

export interface ScenarioSuitePanelProps {
  disabled?: boolean;
  error?: string;
  onClearSelection?: () => void;
  onRunSelected?: () => void;
  onSelectAll?: () => void;
  onToggleScenario?: (scenarioId: string) => void;
  results?: readonly ScenarioSuitePanelResult[];
  running?: boolean;
  scenarios: readonly ScenarioSuitePanelScenario[];
  selectedScenarioIds: readonly string[];
  title?: string;
}

function resultForScenario(
  results: readonly ScenarioSuitePanelResult[],
  scenarioId: string,
): ScenarioSuitePanelResult | undefined {
  return results.find((result) => result.scenarioId === scenarioId);
}

function resultLabel(
  result: ScenarioSuitePanelResult | undefined,
): "fail" | "not-run" | "pass" | "running" {
  return result?.status ?? "not-run";
}

function durationLabel(result: ScenarioSuitePanelResult | undefined): string {
  if (!result) {
    return "Not run";
  }

  return [
    result.message,
    result.durationMs === undefined ? undefined : `${result.durationMs} ms`,
  ]
    .filter(Boolean)
    .join(" / ");
}

export function ScenarioSuitePanel({
  disabled = false,
  error,
  onClearSelection,
  onRunSelected,
  onSelectAll,
  onToggleScenario,
  results = [],
  running = false,
  scenarios,
  selectedScenarioIds,
  title = "LLM scenario suite",
}: ScenarioSuitePanelProps) {
  const selectedIds = new Set(selectedScenarioIds);
  const selectedResults = results.filter((result) =>
    selectedIds.has(result.scenarioId),
  );
  const passedCount = selectedResults.filter(
    (result) => result.status === "pass",
  ).length;
  const completeCount = selectedResults.filter(
    (result) => result.status !== "running",
  ).length;
  const runDisabled =
    disabled || running || selectedScenarioIds.length === 0 || !onRunSelected;

  return (
    <section className="sketchi-scenario-suite-panel">
      <header className="sketchi-scenario-suite-panel__header">
        <div>
          <h2>{title}</h2>
          <p>
            {completeCount === 0
              ? `${selectedScenarioIds.length} selected / ${scenarios.length} total`
              : `${passedCount} / ${completeCount} passed`}
          </p>
        </div>
        <button disabled={runDisabled} onClick={onRunSelected} type="button">
          {running ? "Running" : "Run selected"}
        </button>
      </header>

      <div className="sketchi-scenario-suite-panel__selection-actions">
        <button
          disabled={disabled || running}
          onClick={onSelectAll}
          type="button"
        >
          Select all
        </button>
        <button
          disabled={disabled || running}
          onClick={onClearSelection}
          type="button"
        >
          Clear
        </button>
      </div>

      {error ? (
        <p className="sketchi-scenario-suite-panel__error">{error}</p>
      ) : null}

      <ol className="sketchi-scenario-suite-panel__list">
        {scenarios.map((scenario) => {
          const result = resultForScenario(results, scenario.id);
          const label = resultLabel(result);

          return (
            <li data-status={label} key={scenario.id}>
              <label>
                <input
                  checked={selectedIds.has(scenario.id)}
                  disabled={disabled || running}
                  onChange={() => onToggleScenario?.(scenario.id)}
                  type="checkbox"
                />
                <span>
                  <strong>{scenario.title}</strong>
                  {scenario.difficulty ? (
                    <small>{scenario.difficulty}</small>
                  ) : null}
                </span>
              </label>
              <output aria-label={`${scenario.title} result`}>
                <span>{label}</span>
                <small>{durationLabel(result)}</small>
              </output>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
