import { HomeHero } from "../home-hero/index.js";
import { PipelineFlow } from "../pipeline-flow/index.js";
import { SiteFooter } from "../site-footer/index.js";
import { SiteHeader } from "../site-header/index.js";
import { SurfaceCard } from "../surface-card/index.js";

export function MarketingHome() {
  return (
    <div className="sketchi-web">
      <SiteHeader activePath="/" />

      <main id="top">
        <HomeHero />

        <section className="sk-section" id="pipeline">
          <div className="sk-shell">
            <div className="sk-section__head">
              <p className="sk-eyebrow">Pipeline</p>
              <h2 className="sk-section__title">Generation stays inspectable.</h2>
              <p className="sk-section__lead">
                Each stage is its own package, so failures stay local and
                testable.
              </p>
            </div>
            <PipelineFlow />
          </div>
        </section>

        <section className="sk-section" id="surfaces">
          <div className="sk-shell">
            <div className="sk-section__head">
              <p className="sk-eyebrow">Surfaces</p>
              <h2 className="sk-section__title">Four surfaces, one pipeline.</h2>
              <p className="sk-section__lead">
                Each ships on its own. None need a sign-in.
              </p>
            </div>
            <div className="surface-grid">
              <SurfaceCard
                cta="Open workspace"
                desc="Inspect the IR, scene, and a live Excalidraw canvas."
                domain="excalidraw.sketchi.app"
                href="https://excalidraw.sketchi.app"
                name="Excalidraw workspace"
              />
              <SurfaceCard
                cta="Browse icons"
                desc="Search and copy 1,400+ curated icons."
                domain="icons.sketchi.app"
                href="https://icons.sketchi.app"
                name="Icon library"
              />
              <SurfaceCard
                cta="Open playground"
                desc="Evaluate prompts against the deterministic pipeline."
                domain="playground.sketchi.app"
                href="https://playground.sketchi.app"
                name="Scenario playground"
              />
              <SurfaceCard
                cta="Open docs"
                desc="Pipeline, diagram types, and deploys."
                domain="sketchi.app/docs"
                href="/docs"
                name="Documentation"
                status="live"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
