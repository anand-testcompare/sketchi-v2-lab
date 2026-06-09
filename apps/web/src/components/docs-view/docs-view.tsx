export interface DocsNavEntry {
  href: string;
  label: string;
}

export interface DocsViewProps {
  nav?: readonly DocsNavEntry[];
}

const defaultNav: readonly DocsNavEntry[] = [
  { href: "#overview", label: "Overview" },
  { href: "#surfaces", label: "App surfaces" },
  { href: "#pipeline", label: "Generation pipeline" },
  { href: "#diagram-types", label: "Diagram types" },
  { href: "#no-auth", label: "No-auth status" },
  { href: "#deploy", label: "Deploy" },
];

export function DocsView({ nav = defaultNav }: DocsViewProps) {
  return (
    <div className="sk-shell docs-view">
      <nav aria-label="Docs sections" className="docs-nav">
        <p className="docs-nav__label">On this page</p>
        <ul className="docs-nav__list">
          {nav.map((entry) => (
            <li key={entry.href}>
              <a href={entry.href}>{entry.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <article className="docs-article">
        <p className="sk-eyebrow">Documentation</p>
        <h1 className="sk-section__title">How Sketchi v2 is put together</h1>
        <p className="docs-article__intro">
          Sketchi makes diagram generation boring in the best way: inputs are
          validated, rendering is deterministic, and UI states are exercised
          outside the app shell. These docs cover the contracts that matter for
          the current no-auth phase.
        </p>

        <section className="docs-section" id="overview">
          <h2>
            <span className="docs-section__idx">01</span> Overview
          </h2>
          <p>
            A prompt is compiled into a typed intermediate representation (IR),
            validated, rendered into a deterministic scene, and converted into
            real Excalidraw elements. Each stage lives in its own package, so a
            defect fails close to its cause instead of somewhere downstream.
          </p>
          <p>
            The first high-reliability path is decision-heavy{" "}
            <code>flowchart</code> generation. Code owns layout, arrow routing,
            and text wrapping; the model only produces typed IR.
          </p>
        </section>

        <section className="docs-section" id="surfaces">
          <h2>
            <span className="docs-section__idx">02</span> App surfaces
          </h2>
          <p>
            The workspace ships four independently deployable surfaces. Each one
            owns its UI; shared diagram primitives stay in the studio package.
          </p>
          <dl className="docs-defs">
            <div className="docs-defs__row">
              <dt>sketchi.app</dt>
              <dd>This home and the product documentation.</dd>
            </div>
            <div className="docs-defs__row">
              <dt>excalidraw.sketchi.app</dt>
              <dd>The no-auth diagram workspace built on the same pipeline.</dd>
            </div>
            <div className="docs-defs__row">
              <dt>icons.sketchi.app</dt>
              <dd>A browser for the curated Sketchi icon output.</dd>
            </div>
            <div className="docs-defs__row">
              <dt>playground.sketchi.app</dt>
              <dd>Scenario evaluation and prompt-output inspection.</dd>
            </div>
          </dl>
        </section>

        <section className="docs-section" id="pipeline">
          <h2>
            <span className="docs-section__idx">03</span> Generation pipeline
          </h2>
          <p>
            The pipeline keeps model output, typed IR, deterministic scenes, and
            Excalidraw conversion as separate, testable surfaces.
          </p>
          <dl className="docs-defs">
            <div className="docs-defs__row">
              <dt>diagram-core</dt>
              <dd>The IR, semantic validation, and reusable fixtures.</dd>
            </div>
            <div className="docs-defs__row">
              <dt>diagram-renderer</dt>
              <dd>Validated diagrams become a deterministic scene model.</dd>
            </div>
            <div className="docs-defs__row">
              <dt>diagram-excalidraw</dt>
              <dd>Scenes become persisted Excalidraw elements, validated.</dd>
            </div>
            <div className="docs-defs__row">
              <dt>diagram-scenarios</dt>
              <dd>Maintained prompts and assertions run against fixtures.</dd>
            </div>
          </dl>
          <p>Run the canonical fixture evaluation locally:</p>
          <pre className="docs-codeblock">
            <span className="tok-c"># deterministic IR → Excalidraw, no model</span>
            {"\n"}
            pnpm nx scenario diagram-scenarios -- \{"\n"}
            {"  "}--scenario pharma-batch-disposition --fixture
          </pre>
        </section>

        <section className="docs-section" id="diagram-types">
          <h2>
            <span className="docs-section__idx">04</span> Diagram types
          </h2>
          <p>
            Every registered diagram type is guarded by tests: it must have core,
            renderer, and Storybook coverage. New types are scaffolded with the
            workspace generator so they are previewable before being wired to
            generation.
          </p>
          <dl className="docs-defs">
            <div className="docs-defs__row">
              <dt>flowchart</dt>
              <dd>
                Start, process, decision, and end nodes with labeled branches —
                the first hard reliability target.
              </dd>
            </div>
            <div className="docs-defs__row">
              <dt>mindmap</dt>
              <dd>A radial fixture used to keep the type registry honest.</dd>
            </div>
          </dl>
          <pre className="docs-codeblock">
            <span className="tok-c"># scaffold a new generated diagram type</span>
            {"\n"}
            pnpm nx g @sketchi/generators:diagram-type mindmap
          </pre>
        </section>

        <section className="docs-section" id="no-auth">
          <h2>
            <span className="docs-section__idx">05</span> No-auth status
          </h2>
          <div className="docs-callout">
            <span className="docs-callout__k">Current</span>
            <span>
              The deployable surfaces require no sign-in. Auth, persistence,
              billing, and multi-user collaboration are intentionally out of
              scope for this phase. States are designed so auth can be added
              later without a rewrite.
            </span>
          </div>
        </section>

        <section className="docs-section" id="deploy">
          <h2>
            <span className="docs-section__idx">06</span> Deploy
          </h2>
          <p>
            Pull requests deploy each app to a PR-specific Cloudflare Worker.
            Merges to <code>main</code> deploy production Workers to their{" "}
            <code>workers.dev</code> URLs without claiming the final{" "}
            <code>sketchi.app</code> domains.
          </p>
          <div className="docs-callout">
            <span className="docs-callout__k">Manual</span>
            <span>
              Domain attachment is a deliberate, manual{" "}
              <code>app-production-deploy</code> workflow dispatch. DNS cutover
              is never automatic.
            </span>
          </div>
        </section>
      </article>
    </div>
  );
}
