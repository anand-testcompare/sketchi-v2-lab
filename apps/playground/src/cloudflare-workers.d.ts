declare module "cloudflare:workers" {
  import type {
    CloudflareAiGatewayProvider,
    CloudflareWorkersAiBinding,
  } from "@sketchi/diagram-generation";

  export const env: {
    AI?: CloudflareWorkersAiBinding & CloudflareAiGatewayProvider;
    SKETCHI_AI_GATEWAY_COMPAT_MODEL?: string;
    SKETCHI_AI_GATEWAY_COMPAT_URL?: string;
    SKETCHI_AI_GATEWAY_ID?: string;
    SKETCHI_AI_MODEL?: string;
  };
}
