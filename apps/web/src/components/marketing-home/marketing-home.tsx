export interface MarketingHomeProps {
  previewImageSrc?: string;
}

export function MarketingHome({
  previewImageSrc = "/media/sketchi-playground-preview.png",
}: MarketingHomeProps) {
  return (
    <div className="sketchi-web">
      <nav aria-label="Primary" className="sketchi-web__nav">
        <a className="sketchi-web__brand" href="#top">
          Sketchi
        </a>
        <div className="sketchi-web__links">
          <a href="#pipeline">Pipeline</a>
          <a href="#docs">Docs</a>
          <a href="https://excalidraw.sketchi.app">App</a>
          <a href="https://icons.sketchi.app">Icons</a>
        </div>
      </nav>

      <main id="top">
        <section className="sketchi-web__hero">
          <div className="sketchi-web__hero-copy">
            <p className="sketchi-web__eyebrow">Typed diagram generation</p>
            <h1>Sketchi</h1>
            <p className="sketchi-web__lead">
              Prompt-to-diagram tooling with validated intermediate
              representations, deterministic rendering, and Excalidraw-ready
              output.
            </p>
            <div className="sketchi-web__actions">
              <a href="https://excalidraw.sketchi.app">Open app</a>
              <a href="#docs">Read docs</a>
            </div>
          </div>
          <figure className="sketchi-web__hero-visual">
            <img
              alt="Sketchi playground showing a generated Excalidraw flowchart"
              src={previewImageSrc}
            />
          </figure>
        </section>

        <section className="sketchi-web__section" id="pipeline">
          <div className="sketchi-web__section-inner">
            <h2>Generation paths stay inspectable.</h2>
            <p className="sketchi-web__section-lead">
              Sketchi keeps model output, typed IR, deterministic scenes, and
              Excalidraw conversion as separate surfaces so failures are local
              and testable.
            </p>
            <div className="sketchi-web__feature-grid">
              <article className="sketchi-web__feature">
                <h3>Typed IR</h3>
                <p>
                  Flowcharts and future diagram types start from explicit nodes,
                  edges, layout hints, and validation rules.
                </p>
              </article>
              <article className="sketchi-web__feature">
                <h3>Deterministic render</h3>
                <p>
                  Code owns layout, text fit, arrow routing, and Excalidraw
                  scene conversion after generation.
                </p>
              </article>
              <article className="sketchi-web__feature">
                <h3>Scenario proof</h3>
                <p>
                  Maintained prompts and fixtures exercise the same pipeline
                  before the product app adds persistence and auth.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sketchi-web__section" id="docs">
          <div className="sketchi-web__section-inner">
            <h2>Docs</h2>
            <p className="sketchi-web__section-lead">
              The public docs start with the contracts that matter most for the
              next phase: app surfaces, diagram generation, and icon output.
            </p>
            <div className="sketchi-web__doc-grid">
              <article className="sketchi-web__doc">
                <h3>App map</h3>
                <ol>
                  <li>sketchi.app hosts product and architecture docs.</li>
                  <li>excalidraw.sketchi.app hosts the diagram workspace.</li>
                  <li>icons.sketchi.app hosts curated Sketchi icon output.</li>
                </ol>
              </article>
              <article className="sketchi-web__doc">
                <h3>Current contracts</h3>
                <ol>
                  <li>
                    No auth is required for the first deployable surfaces.
                  </li>
                  <li>App-owned UI stays inside the app that uses it.</li>
                  <li>
                    Shared diagram packages stay focused on core behavior.
                  </li>
                </ol>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="sketchi-web__footer">
        <div className="sketchi-web__footer-inner">
          <span>Sketchi v2</span>
          <a href="https://playground.sketchi.app">Open playground</a>
        </div>
      </footer>
    </div>
  );
}
