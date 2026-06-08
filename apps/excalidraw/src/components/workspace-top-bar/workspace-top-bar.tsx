export type WorkspaceStatus = "empty" | "error" | "loading" | "ready";

export interface WorkspaceTopBarProps {
  diagramType?: string | undefined;
  status?: WorkspaceStatus;
  title: string;
}

const statusMeta: Record<WorkspaceStatus, { dot: string; label: string }> = {
  empty: { dot: "sk-pill__dot--blueprint", label: "Empty" },
  error: { dot: "sk-pill__dot--danger", label: "Error" },
  loading: { dot: "sk-pill__dot--accent", label: "Generating" },
  ready: { dot: "sk-pill__dot--ok", label: "Ready" },
};

export function WorkspaceTopBar({
  diagramType,
  status = "ready",
  title,
}: WorkspaceTopBarProps) {
  const meta = statusMeta[status];

  return (
    <header className="workspace-top-bar">
      <div className="workspace-top-bar__brand">
        <span className="workspace-top-bar__mark" aria-hidden="true">
          <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
            <circle cx="3.5" cy="3.5" fill="currentColor" r="2.2" />
            <circle cx="12.5" cy="12.5" fill="currentColor" r="2.2" />
            <path
              d="M5 4.5 Q10 4 11 11"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <span className="workspace-top-bar__heading">
          <span className="workspace-top-bar__eyebrow">Sketchi workspace</span>
          <span className="workspace-top-bar__title">{title}</span>
        </span>
        {diagramType ? (
          <span className="workspace-top-bar__type">{diagramType}</span>
        ) : null}
      </div>

      <div className="workspace-top-bar__meta">
        <span className="sk-pill" aria-label="No-auth preview">
          <span className="sk-pill__dot sk-pill__dot--blueprint" />
          No sign-in · not saved
        </span>
        <span className="sk-pill" role="status">
          <span className={`sk-pill__dot ${meta.dot}`} />
          {meta.label}
        </span>
      </div>
    </header>
  );
}
