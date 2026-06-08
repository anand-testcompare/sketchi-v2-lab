export interface SiteFooterProps {
  colophon?: string;
}

export function SiteFooter({
  colophon = "Sketchi v2 — typed diagram generation",
}: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="sk-shell site-footer__inner">
        <div className="site-footer__about">
          <span className="site-footer__brand">
            <span className="site-footer__mark" aria-hidden="true">
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
            Sketchi
          </span>
          <p className="site-footer__tagline">
            Prompt-to-diagram tooling with validated IR, deterministic
            rendering, and Excalidraw-ready output.
          </p>
        </div>

        <div className="site-footer__col">
          <h3>Product</h3>
          <ul>
            <li>
              <a href="/#pipeline">Pipeline</a>
            </li>
            <li>
              <a href="/docs">Docs</a>
            </li>
            <li>
              <a href="https://playground.sketchi.app">Playground</a>
            </li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3>Surfaces</h3>
          <ul>
            <li>
              <a href="https://excalidraw.sketchi.app">Excalidraw app</a>
            </li>
            <li>
              <a href="https://icons.sketchi.app">Icons</a>
            </li>
            <li>
              <a href="/docs#surfaces">Surface map</a>
            </li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3>Project</h3>
          <ul>
            <li>
              <a href="/docs#deploy">Deploy</a>
            </li>
            <li>
              <a href="/docs#no-auth">No-auth status</a>
            </li>
            <li>
              <a href="https://github.com/shpitdev/sketchi">Upstream</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer__base">
        <div className="sk-shell site-footer__base-inner">
          <span>{colophon}</span>
          <span>No sign-in · PR previews · workers.dev production</span>
        </div>
      </div>
    </footer>
  );
}
