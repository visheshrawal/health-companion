"use node";
import { action } from "./_generated/server";
import { VlyIntegrations } from "@vly-ai/integrations";

export const send = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.VLY_INTEGRATION_KEY;
    
    if (!apiKey) {
      console.error("VLY_INTEGRATION_KEY is missing");
      return { success: false, error: "VLY_INTEGRATION_KEY not set" };
    }

    console.log("VLY_INTEGRATION_KEY is present (length: " + apiKey.length + ")");

    try {
        // Initialize SDK with token
        const vly = new VlyIntegrations({
            token: apiKey,
        });
        
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