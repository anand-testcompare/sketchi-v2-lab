import "@tanstack/react-start/server-only";

import { env } from "cloudflare:workers";

import type { StudioEnv } from "./chat-gateway";

export function getStudioBindings(): StudioEnv {
  return env as unknown as StudioEnv;
}
