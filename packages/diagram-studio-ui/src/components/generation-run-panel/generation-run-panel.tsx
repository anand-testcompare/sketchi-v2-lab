import type {
  DiagramGenerationCandidateSummary,
  DiagramGenerationProviderId,
} from "@sketchi/diagram-generation";

export interface GenerationRunPanelProps {
  candidates?: readonly DiagramGenerationCandidateSummary[];
  disabled?: boolean;
  error?: string;
  onRun?: () => void;
  providers?: readonly GenerationRunProvider[];
  running?: boolean;
  title?: string;
}

export interface GenerationRunProvider {
  id: DiagramGenerationProviderId;
  label: string;
}

const defaultProviders: readonly GenerationRunProvider[] = [
  { id: "cloudflare-google-ai-studio", label: "Gateway BYOK" },
];

function providerCandidate(
  candidates: readonly DiagramGenerationCandidateSummary[],
  providerId: DiagramGenerationProviderId,
): DiagramGenerationCandidateSummary | undefined {
  return candidates.find((candidate) => candidate.provider === providerId);
}

function providerStatus(
  candidate: DiagramGenerationCandidateSummary | undefined,
) {
  if (!candidate) {
    return "Ready";
  }

  if (candidate.error) {
    return "Failed";
  }

  if (candidate.diagramValid) {
    return "Valid IR";
  }

  return "Returned";
}

function tokenSummary(
  candidate: DiagramGenerationCandidateSummary,
): string | undefined {
  if (candidate.usage?.totalTokens === undefined) {
    return undefined;
  }

  return `${candidate.usage.totalTokens} tokens`;
}

function diagnosticSummary(
  candidate: DiagramGenerationCandidateSummary,
): string | undefined {
  const diagnostics = candidate.diagnostics.filter(
    (diagnostic) => diagnostic !== candidate.error,
  );

  return diagnostics.length > 0 ? diagnostics.join(" ") : undefined;
}

export function GenerationRunPanel({
  candidates = [],
  disabled = false,
  error,
  onRun,
  providers = defaultProviders,
  running = false,
  title = "LLM run",
}: GenerationRunPanelProps) {
  return (
    <section className="sketchi-generation-run-panel">
      <header>
        <h2>{title}</h2>
        <button
          disabled={disabled || running || !onRun}
          onClick={onRun}
          type="button"
        >
          {running ? "Running" : "Run"}
        </button>
      </header>

      {error ? (
        <p className="sketchi-generation-run-panel__error">{error}</p>
      ) : null}

      <ul>
        {providers.map((provider) => {
          const candidate = providerCandidate(candidates, provider.id);
          const status = providerStatus(candidate);
          const duration =
            candidate?.durationMs === undefined
              ? undefined
              : `${candidate.durationMs} ms`;
          const tokens = candidate ? tokenSummary(candidate) : undefined;
          const diagnostics = candidate
            ? diagnosticSummary(candidate)
            : undefined;

          return (
            <li data-status={status.toLowerCase()} key={provider.id}>
              <div>
                <span>{provider.label}</span>
                <strong>{status}</strong>
              </div>
              {candidate?.model ? <code>{candidate.model}</code> : null}
              {candidate?.error ? <p>{candidate.error}</p> : null}
              {diagnostics ? (
                <p className="sketchi-generation-run-panel__diagnostics">
                  {diagnostics}
                </p>
              ) : null}
              {duration || tokens ? (
                <small>{[duration, tokens].filter(Boolean).join(" / ")}</small>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
