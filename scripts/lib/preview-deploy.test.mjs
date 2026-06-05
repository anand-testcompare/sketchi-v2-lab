import assert from "node:assert/strict";
import test from "node:test";

import {
  extractPreviewUrl,
  previewCommentBody,
  previewWorkerName,
  previewWranglerConfig,
} from "./preview-deploy.mjs";

test("previewWorkerName creates a stable Cloudflare-safe PR worker name", () => {
  assert.equal(
    previewWorkerName({ prNumber: 42, workerPrefix: "Sketchi Playground PR" }),
    "sketchi-playground-pr-42",
  );
});

test("previewWorkerName rejects invalid PR numbers", () => {
  assert.throws(
    () => previewWorkerName({ prNumber: "nope" }),
    /positive integer/,
  );
});

test("previewWranglerConfig isolates preview worker settings", () => {
  const previewConfig = previewWranglerConfig(
    {
      name: "sketchi-playground",
      topLevelName: "sketchi-playground",
      route: "playground.sketchi.app/*",
      routes: ["playground.sketchi.app/*"],
      domains: [{ pattern: "playground.sketchi.app" }],
      vars: {
        SKETCHI_AI_GATEWAY_ID: "google-ai-studio",
      },
    },
    "sketchi-playground-pr-42",
  );

  assert.equal(previewConfig.name, "sketchi-playground-pr-42");
  assert.equal(previewConfig.topLevelName, "sketchi-playground-pr-42");
  assert.equal(previewConfig.workers_dev, true);
  assert.equal(previewConfig.preview_urls, false);
  assert.equal(previewConfig.route, undefined);
  assert.equal(previewConfig.routes, undefined);
  assert.equal(previewConfig.domains, undefined);
  assert.deepEqual(previewConfig.vars, {
    SKETCHI_AI_GATEWAY_ID: "google-ai-studio",
  });
});

test("extractPreviewUrl prefers the URL for the requested worker", () => {
  const log = [
    "Uploaded sketchi-playground",
    "https://sketchi-playground.account.workers.dev",
    "Uploaded sketchi-playground-pr-42",
    "https://sketchi-playground-pr-42.account.workers.dev",
  ].join("\n");

  assert.equal(
    extractPreviewUrl(log, "sketchi-playground-pr-42"),
    "https://sketchi-playground-pr-42.account.workers.dev",
  );
});

test("previewCommentBody includes ready preview details", () => {
  assert.equal(
    previewCommentBody({
      previewUrl: "https://sketchi-playground-pr-42.account.workers.dev",
      runUrl:
        "https://github.com/anand-testcompare/sketchi-v2-lab/actions/runs/1",
      sha: "abcdef1234567890",
      status: "ready",
      workerName: "sketchi-playground-pr-42",
    }),
    [
      "<!-- sketchi-playground-preview -->",
      "### Sketchi Playground Preview",
      "",
      "Status: `ready`",
      "- URL: https://sketchi-playground-pr-42.account.workers.dev",
      "- Worker: `sketchi-playground-pr-42`",
      "- Commit: `abcdef123456`",
      "- Workflow run: https://github.com/anand-testcompare/sketchi-v2-lab/actions/runs/1",
      "",
    ].join("\n"),
  );
});

test("previewCommentBody marks deleted previews", () => {
  assert.match(
    previewCommentBody({
      status: "deleted",
      workerName: "sketchi-playground-pr-42",
    }),
    /Preview Worker cleanup has completed/,
  );
});
