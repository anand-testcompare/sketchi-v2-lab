import { HomeHero } from "../home-hero/index.js";
import { PipelineFlow } from "../pipeline-flow/index.js";
import { SiteFooter } from "../site-footer/index.js";
import { SiteHeader } from "../site-header/index.js";
import { SurfaceCard } from "../surface-card/index.js";

export interface MarketingHomeProps {
  previewImageSrc?: string;
}

export function MarketingHome({
  previewImageSrc = "/media/sketchi-playground-preview.png",
}: MarketingHomeProps) {
  return (
    <div className="sketchi-web">
      <SiteHeader activePath="/" />

      <main id="top">
        <HomeHero />

        <section className="sk-section" id="pipeline">
          <div className="sk-shell">
            <div className="sk-section__head">
              <p className="sk-eyebrow">The pipeline</p>
              <h2 className="sk-section__title">
                Generation paths stay inspectable.
              </h2>
              <p className="sk-section__lead">
                Model output, typed IR, deterministic scenes, and Excalidraw
                conversion live as separate surfaces — so failures are local and
                testable, not buried in one black box.
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
                Each surface ships independently and owns its UI. None of them
                require a sign-in yet.
              </p>
            </div>
            <div className="surface-grid">
              <SurfaceCard
                cta="Open workspace"
                desc="The no-auth diagram workspace. Inspect the IR, scene, and a real Excalidraw canvas side by side."
                domain="excalidraw.sketchi.app"
                href="https://excalidraw.sketchi.app"
                name="Excalidraw workspace"
              />
              <SurfaceCard
                cta="Browse icons"
                desc="Search, filter, inspect, and copy the curated Sketchi icon output — over 1,400 icons across 30 collections."
                domain="icons.sketchi.app"
                href="https://icons.sketchi.app"
                name="Icon library"
              />
              <SurfaceCard
                cta="Open playground"
                desc="Evaluate maintained scenarios and inspect raw prompt output against the deterministic pipeline."
                domain="playground.sketchi.app"
                href="https://playground.sketchi.app"
                name="Scenario playground"
              />
              <SurfaceCard
                cta="Open docs"
                desc="How the pipeline, diagram types, no-auth status, and deploys fit together."
                domain="sketchi.app/docs"
                href="/docs"
                name="Documentation"
                status="live"
              />
            </div>
          </div>
        </section>

        <section className="sk-section" id="playground">
          <div className="sk-shell playground-preview">
            <div className="playground-preview__copy">
              <p className="sk-eyebrow">Proof, not promises</p>
              <h2 className="sk-section__title">
                The playground exercises the real pipeline.
              </h2>
              <ul className="playground-preview__list">
                <li>
                  <b>Maintained scenarios</b>
                  Prompts and assertions run against fixtures and one-shot model
                  output.
                </li>
                <li>
                  <b>Deterministic conversion</b>
                  The same IR-to-Excalidraw path the workspace uses, with no
                  persistence or auth.
                </li>
                <li>
                  <b>Inspectable output</b>
                  Read the typed IR and the validated scene before anything is
                  drawn.
                </li>
              </ul>
            </div>
            <figure className="playground-preview__shot">
              <img
                alt="Sketchi playground showing a generated Excalidraw flowchart"
                src={previewImageSrc}
              />
            </figure>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
