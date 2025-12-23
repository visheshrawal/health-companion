// import { VlyIntegrations } from "@vly-ai/integrations";

// export const vly = new VlyIntegrations({
//   token: process.env.VLY_INTEGRATION_KEY!,
// });

// Mock export to prevent build errors if imported elsewhere
export const vly = {
  ai: {
    completion: async () => ({ success: false, error: "Integration disabled" })
  },
  email: {
    send: async () => ({ success: false, error: "Integration disabled" })
  }
};
