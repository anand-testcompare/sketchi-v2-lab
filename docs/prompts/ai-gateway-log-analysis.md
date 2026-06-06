# AI Gateway Log Analysis

Use this prompt with the Cloudflare API MCP in Code Mode. The MCP should be
configured as:

```json
{
  "mcpServers": {
    "cloudflare-api": {
      "url": "https://mcp.cloudflare.com/mcp"
    }
  }
}
```

## Prompt

You are analyzing Sketchi playground AI Gateway logs for prompt-tuning and
diagram-generation reliability.

Use the Cloudflare API MCP to inspect the `google-ai-studio` AI Gateway in the
Sketchi Cloudflare account. Prefer narrow reads and summarize only the fields
needed for debugging.

Start by finding the account ID and AI Gateway log endpoints if they are not
already known. Then inspect recent Gateway logs for the deployed playground.
Prefer log detail fields such as `request_head` and `response_head` when they
are marked complete. Use separate request/response payload endpoints only when
the detail record does not include enough retained payload data.

For each relevant request, report:

- Timestamp, model, provider route, status, latency, and token usage.
- Scenario ID or scenario title from request metadata or payload.
- Whether request and response payloads were retained.
- The system prompt and user prompt split, when payloads are available.
- Whether the model response was valid JSON.
- Whether the response satisfied the flowchart IR contract: exactly one start,
  at least one end, valid node IDs, valid edge references, no outgoing edges
  from end nodes, decision edges labeled, and no disconnected nodes.
- Any recurring failure pattern that should become a scenario assertion or prompt
  change.

When payloads are available, compare the output against the maintained scenario
expectations instead of only eyeballing the JSON. Keep the conclusion concrete:

- `pass`: model output was valid and semantically matched the scenario.
- `prompt-risk`: model output was syntactically valid but missed scenario
  semantics or produced avoidable ambiguity.
- `contract-fail`: model output violated the typed IR contract.
- `gateway-fail`: provider, auth, route, timeout, or Gateway behavior prevented
  evaluation.

Do not mutate Cloudflare resources. Do not delete logs. Do not print secrets,
provider credentials, bearer tokens, or full unrelated payloads.
