import { VlyIntegrations } from "@vly-ai/integrations";

if (!process.env.VLY_INTEGRATION_KEY) {
  throw new Error("VLY_INTEGRATION_KEY is not set");
}

export const vly = new VlyIntegrations({
  token: process.env.VLY_INTEGRATION_KEY!,
} as any);