import { VlyIntegrations } from "@vly-ai/integrations";

export const vly = new VlyIntegrations({
  token: process.env.VLY_INTEGRATION_KEY!,
});