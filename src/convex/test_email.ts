"use node";
import { action } from "./_generated/server";
import { VlyIntegrations } from "@vly-ai/integrations";

export const send = action({
  args: {},
  handler: async (ctx) => {
    if (!process.env.VLY_INTEGRATION_KEY) {
      return { success: false, error: "VLY_INTEGRATION_KEY not set" };
    }

    const vly = new VlyIntegrations({
      token: process.env.VLY_INTEGRATION_KEY,
    });
    
    try {
        console.log("Attempting to send test email using SDK...");
        const res = await vly.email.send({
            to: "test@example.com",
            subject: "Test Email",
            html: "<p>This is a test email to verify the Vly Integrations SDK.</p>"
        });
        console.log("SDK Send Result:", res);
        return { success: true, result: res };
    } catch (e: any) {
        console.error("SDK Error:", e);
        return { success: false, error: e.message, stack: e.stack };
    }
  }
});