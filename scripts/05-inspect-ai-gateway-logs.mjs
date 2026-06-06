#!/usr/bin/env node

const API_BASE_URL = "https://api.cloudflare.com/client/v4";
const DEFAULT_GATEWAY_ID = "google-ai-studio";
const DEFAULT_LIMIT = 5;

function usage() {
  return [
    "Usage: pnpm ai-gateway:logs [-- --limit 5] [--include-payload] [--log-id <id>] [--gateway-id <id>]",
    "",
    "Requires CLOUDFLARE_ACCOUNT_ID and a token with AI Gateway Read permission.",
    "Use CLOUDFLARE_AI_GATEWAY_API_TOKEN for log inspection, or CLOUDFLARE_API_TOKEN if it has that scope.",
    "SKETCHI_AI_GATEWAY_ID is used when --gateway-id is omitted.",
  ].join("\n");
}

function parsePositiveInteger(value, name) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function parseArgs(argv) {
  const options = {
    gatewayId: process.env.SKETCHI_AI_GATEWAY_ID ?? DEFAULT_GATEWAY_ID,
    includePayload: false,
    limit: DEFAULT_LIMIT,
    logId: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === "--include-payload") {
      options.includePayload = true;
      continue;
    }

    if (arg === "--gateway-id") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("--gateway-id requires a value.");
      }

      options.gatewayId = value;
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("--limit requires a value.");
      }

      options.limit = parsePositiveInteger(value, "--limit");
      index += 1;
      continue;
    }

    if (arg === "--log-id") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("--log-id requires a value.");
      }

      options.logId = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function cloudflareToken() {
  return (
    process.env.CLOUDFLARE_AI_GATEWAY_API_TOKEN ??
    requiredEnv("CLOUDFLARE_API_TOKEN")
  );
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

async function cloudflareApi(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const body = await readJson(response);

  if (!response.ok || body?.success === false) {
    const message =
      body?.errors?.map((error) => error.message).join(" ") ||
      body?.message ||
      `Cloudflare API request failed with HTTP ${response.status}.`;

    throw new Error(message);
  }

  return body?.result ?? body;
}

function gatewayPath(accountId, gatewayId, suffix = "") {
  return `/accounts/${encodeURIComponent(
    accountId,
  )}/ai-gateway/gateways/${encodeURIComponent(gatewayId)}/logs${suffix}`;
}

async function listLogs({ accountId, gatewayId, limit, token }) {
  const params = new URLSearchParams({ per_page: String(limit) });
  const result = await cloudflareApi(
    `${gatewayPath(accountId, gatewayId)}?${params}`,
    token,
  );

  return Array.isArray(result) ? result.slice(0, limit) : [];
}

async function getLog({ accountId, gatewayId, logId, token }) {
  return cloudflareApi(
    gatewayPath(accountId, gatewayId, `/${encodeURIComponent(logId)}`),
    token,
  );
}

async function getLogPayload({ accountId, gatewayId, kind, logId, token }) {
  try {
    return await cloudflareApi(
      gatewayPath(
        accountId,
        gatewayId,
        `/${encodeURIComponent(logId)}/${kind}`,
      ),
      token,
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Payload fetch failed.",
    };
  }
}

async function withPayloads({ accountId, gatewayId, logs, token }) {
  return Promise.all(
    logs.map(async (log) => {
      const logId = log?.id;

      if (typeof logId !== "string" || logId.length === 0) {
        return log;
      }

      const [request, response] = await Promise.all([
        getLogPayload({ accountId, gatewayId, kind: "request", logId, token }),
        getLogPayload({ accountId, gatewayId, kind: "response", logId, token }),
      ]);

      return { ...log, request, response };
    }),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const token = cloudflareToken();
  const logs = options.logId
    ? [
        await getLog({
          accountId,
          gatewayId: options.gatewayId,
          logId: options.logId,
          token,
        }),
      ]
    : await listLogs({
        accountId,
        gatewayId: options.gatewayId,
        limit: options.limit,
        token,
      });
  const outputLogs = options.includePayload
    ? await withPayloads({
        accountId,
        gatewayId: options.gatewayId,
        logs,
        token,
      })
    : logs;

  console.log(
    JSON.stringify(
      {
        count: outputLogs.length,
        gatewayId: options.gatewayId,
        includePayload: options.includePayload,
        logs: outputLogs,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error("");
  console.error(usage());
  process.exit(1);
});
