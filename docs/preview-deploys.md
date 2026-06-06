# Playground Preview Deploys

Pull requests to `main` deploy the playground to a PR-specific Cloudflare
Worker named `sketchi-playground-pr-<number>`.

The preview workflow:

- uses the same pnpm 11.5.0, Node 24, `pnpm install --frozen-lockfile` setup as
  `v2-ci`;
- builds the `playground` Nx app;
- writes a generated `dist/server/wrangler.preview.json` with the preview Worker
  name and no custom production routes;
- runs `wrangler deploy --keep-vars`;
- writes or updates one sticky PR comment with the preview URL.

Required GitHub Actions configuration:

- `CHROMATIC_PROJECT_TOKEN`: `staging` environment secret for Storybook
  publish and visual checks.
- `CLOUDFLARE_ACCOUNT_ID`: `staging` environment variable or secret.
- `CLOUDFLARE_API_TOKEN`: `staging` environment secret with Workers
  edit/deploy access.

The canonical source for those GitHub Actions values is the Infisical `sketchi`
project under `/github`, synced to GitHub environment secrets:

- `staging`: GitHub `staging` environment for CI and PR preview deploys.
- `prod`: GitHub `production` environment for production deploys.

Do not sync both Infisical environments into the same repository-secret
namespace; environment-scoped GitHub secrets keep preview and production values
from overwriting each other when the values eventually diverge.

Cloudflare documents that non-interactive CI deploys require an API token and
account ID. The token should stay in GitHub Secrets, not in source control.

Cleanup runs automatically when a PR closes and deletes the PR-specific Worker.
Manual cleanup is also available:

```sh
CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... \
  node scripts/04-delete-preview-worker.mjs --pr-number 123
```

The deploy command scripts are numbered because they are operational steps:

- `scripts/01-prepare-preview-deploy.mjs`
- `scripts/02-extract-preview-url.mjs`
- `scripts/03-upsert-preview-comment.mjs`
- `scripts/04-delete-preview-worker.mjs`
