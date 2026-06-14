import { describe, expect, it } from "vitest";

import {
  handleBuildFlowchartRequest,
  handleGetArtifactRequest,
  handlePatchArtifactRequest,
} from "./codemode-api.server";

function approvalSpec() {
  return {
    title: "Worker API approval flow",
    nodes: [
      { id: "request", label: "Request arrives", kind: "start" },
      { id: "approve", label: "Approved?", kind: "decision" },
      { id: "done", label: "Done", kind: "end" },
      { id: "revise", label: "Revise", kind: "end" },
    ],
    edges: [
      { source: "request", target: "approve" },
      { source: "approve", target: "done", label: "yes" },
      { source: "approve", target: "revise", label: "no" },
    ],
  };
}

function postRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function artifactIdFrom(value: unknown): string {
  if (
    isRecord(value) &&
    isRecord(value.artifact) &&
    typeof value.artifact.artifactId === "string"
  ) {
    return value.artifact.artifactId;
  }
  throw new Error("Response did not contain an artifact id.");
}

describe("Code Mode API handlers", () => {
  it("builds, retrieves, and patches an artifact through Response handlers", async () => {
    const buildResponse = await handleBuildFlowchartRequest(
      {},
      postRequest("https://studio.test/api/v1/flowcharts/build", {
        spec: approvalSpec(),
      }),
    );

    expect(buildResponse.status).toBe(200);
    const built: unknown = await buildResponse.json();
    expect(built).toMatchObject({ ok: true, status: "accepted" });

    const artifactId = artifactIdFrom(built);
    const getResponse = await handleGetArtifactRequest(
      {},
      new Request(
        `https://studio.test/api/v1/artifacts/${artifactId}?format=scene`,
      ),
      artifactId,
    );

    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toMatchObject({
      ok: true,
      artifactId,
      format: "scene",
    });

    const invalidGetResponse = await handleGetArtifactRequest(
      {},
      new Request(
        `https://studio.test/api/v1/artifacts/${artifactId}?format=svg`,
      ),
      artifactId,
    );

    expect(invalidGetResponse.status).toBe(400);
    await expect(invalidGetResponse.json()).resolves.toMatchObject({
      ok: false,
      status: "invalid_input",
    });

    const patchResponse = await handlePatchArtifactRequest(
      {},
      postRequest(`https://studio.test/api/v1/artifacts/${artifactId}/patch`, {
        operations: [
          {
            op: "setStyle",
            selector: { nodeIds: ["approve"] },
            style: { strokeColor: "#7c3aed", fillColor: "#ede9fe" },
          },
        ],
      }),
      artifactId,
    );

    expect(patchResponse.status).toBe(200);
    await expect(patchResponse.json()).resolves.toMatchObject({
      ok: true,
      sourceArtifactId: artifactId,
      status: "accepted",
    });
  });
});
