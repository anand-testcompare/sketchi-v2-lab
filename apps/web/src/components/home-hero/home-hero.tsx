export interface HomeHeroProps {
  docsHref?: string;
  eyebrow?: string;
  lead?: string;
  primaryHref?: string;
}

function HeroDiagram() {
  return (
    <svg
      aria-label="A prompt compiling into a validated, deterministic diagram"
      className="hero-diagram"
      role="img"
      viewBox="0 0 480 372"
      width="100%"
    >
      <defs>
        <marker
          id="hero-arrow"
          markerHeight="7"
          markerWidth="7"
          orient="auto-start-reverse"
          refX="5"
          refY="3.5"
        >
          <path d="M0 0 L7 3.5 L0 7 z" fill="var(--ink-3)" />
        </marker>
      </defs>

      {/* edges */}
      <path
        className="hero-diagram__edge hero-diagram__edge--a"
        d="M240 66 L240 90"
        markerEnd="url(#hero-arrow)"
      />
      <path
        className="hero-diagram__edge hero-diagram__edge--b"
        d="M240 138 L240 162"
        markerEnd="url(#hero-arrow)"
      />
      <path
        className="hero-diagram__edge hero-diagram__edge--c"
        d="M240 252 L240 282"
        markerEnd="url(#hero-arrow)"
      />
      <path
        className="hero-diagram__edge hero-diagram__edge--d"
        d="M166 210 L96 210 L96 115 L161 115"
        markerEnd="url(#hero-arrow)"
      />

      {/* nodes */}
      <rect
        className="hero-diagram__node hero-diagram__node--accent"
        height="46"
        rx="10"
        width="150"
        x="165"
        y="20"
      />
      <text className="hero-diagram__label" textAnchor="middle" x="240" y="48">
        Prompt
      </text>

      <rect
        className="hero-diagram__node"
        height="46"
        rx="10"
        width="150"
        x="165"
        y="92"
      />
      <text className="hero-diagram__label" textAnchor="middle" x="240" y="120">
        Typed IR
      </text>

      <polygon
        className="hero-diagram__node"
        points="240,164 316,210 240,256 164,210"
      />
      <text className="hero-diagram__label" textAnchor="middle" x="240" y="214">
        Validate
      </text>

      <rect
        className="hero-diagram__node hero-diagram__node--ok"
        height="46"
        rx="10"
        width="150"
        x="165"
        y="282"
      />
      <text className="hero-diagram__label" textAnchor="middle" x="240" y="310">
        Scene
      </text>

      {/* branch labels */}
      <text className="hero-diagram__branch" x="250" y="274">
        pass
      </text>
      <text className="hero-diagram__branch" x="58" y="166">
        revise
      </text>
    </svg>
  );
}

export function HomeHero({
  docsHref = "/docs",
  eyebrow = "Typed diagram generation",
  lead = "Sketchi compiles a prompt into a typed, validated intermediate representation, then renders deterministic Excalidraw-ready scenes. Every step stays inspectable.",
  primaryHref = "https://excalidraw.sketchi.app",
}: HomeHeroProps) {
  return (
    <section className="home-hero">
      <div className="sk-shell home-hero__inner">
        <div className="home-hero__copy">
          <p className="sk-eyebrow sk-rise" style={{ "--i": 0 } as never}>
            {eyebrow}
          </p>
          <h1 className="home-hero__title sk-rise" style={{ "--i": 1 } as never}>
            Prompts become <em>validated diagrams.</em>
          </h1>
          <p className="home-hero__lead sk-rise" style={{ "--i": 2 } as never}>
            {lead}
          </p>
          <div
            className="home-hero__actions sk-rise"
            style={{ "--i": 3 } as never}
          >
            <a className="sk-btn sk-btn--primary" href={primaryHref}>
              Open the app
            </a>
            <a className="sk-btn sk-btn--ghost" href={docsHref}>
              Read the docs
            </a>
          </div>
          <p className="home-hero__meta sk-rise" style={{ "--i": 4 } as never}>
            <span>
              <b>No sign-in</b> required
            </span>
            <span>
              <b>Flowchart</b> contract live
            </span>
            <span>
              <b>Deterministic</b> renderer
            </span>
          </p>
        </div>

        <div className="home-hero__visual sk-rise" style={{ "--i": 2 } as never}>
          <div className="hero-frame">
            <div className="hero-frame__bar">
              <span className="hero-frame__dots">
                <span />
                <span />
                <span />
              </span>
              <span className="hero-frame__tag">flowchart · onboarding-flow</span>
            </div>
            <div className="hero-frame__stage">
              <HeroDiagram />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
