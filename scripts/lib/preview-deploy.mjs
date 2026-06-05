const DEFAULT_WORKER_PREFIX = "sketchi-playground-pr";
const MAX_WORKER_NAME_LENGTH = 63;

export function normalizePrNumber(value) {
  const prNumber = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isInteger(prNumber) || prNumber < 1) {
    throw new Error("PR number must be a positive integer.");
  }

  return prNumber;
}

export function previewWorkerName(input) {
  const prNumber = normalizePrNumber(input.prNumber);
  const rawPrefix = (input.workerPrefix ?? DEFAULT_WORKER_PREFIX).trim();
  const prefix = rawPrefix
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!prefix) {
    throw new Error("Preview worker prefix must contain letters or numbers.");
  }

  const workerName = `${prefix}-${prNumber}`;

  if (
    workerName.length > MAX_WORKER_NAME_LENGTH ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(workerName)
  ) {
    throw new Error(
      `Invalid preview worker name "${workerName}". Use a shorter alphanumeric/hyphen prefix.`,
    );
  }

  return workerName;
}

export function previewWranglerConfig(config, workerName) {
  const nextConfig = structuredClone(config);

  nextConfig.name = workerName;
  nextConfig.topLevelName = workerName;
  nextConfig.workers_dev = true;
  nextConfig.preview_urls = false;

  delete nextConfig.route;
  delete nextConfig.routes;
  delete nextConfig.domains;
  delete nextConfig.custom_domain;
  delete nextConfig.custom_domains;

  return nextConfig;
}

export function extractPreviewUrl(logText, workerName = "") {
  const urls = [
    ...logText.matchAll(/https:\/\/[a-z0-9][a-z0-9.-]*\.workers\.dev\b/g),
  ].map(([url]) => url);
  const workerUrl = workerName
    ? urls.findLast((url) => url.includes(`://${workerName}.`))
    : undefined;

  return workerUrl ?? urls.at(-1) ?? null;
}

export function previewCommentBody(input) {
  const status = (input.status ?? "ready").trim().toLowerCase();
  const runUrl = input.runUrl?.trim();
  const previewUrl = input.previewUrl?.trim();
  const workerName = input.workerName?.trim();
  const sha = input.sha?.trim();
  const marker = input.marker?.trim() || "<!-- sketchi-playground-preview -->";
  const lines = [
    marker,
    "### Sketchi Playground Preview",
    "",
    `Status: \`${status}\``,
  ];

  if (previewUrl) {
    lines.push(`- URL: ${previewUrl}`);
  }

  if (workerName) {
    lines.push(`- Worker: \`${workerName}\``);
  }

  if (sha) {
    lines.push(`- Commit: \`${sha.slice(0, 12)}\``);
  }

  if (runUrl) {
    lines.push(`- Workflow run: ${runUrl}`);
  }

  if (status === "deleted") {
    lines.push("", "Preview Worker cleanup has completed.");
  }

  if (status === "unconfigured") {
    lines.push(
      "",
      "Preview deploy is wired, but Cloudflare credentials are not configured for this repository yet.",
    );
  }

  return `${lines.join("\n")}\n`;
}
