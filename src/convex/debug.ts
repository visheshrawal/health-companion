"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { VlyIntegrations } from "@vly-ai/integrations";

export const testEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    console.log("Testing Vly Email Integration...");
    
    if (!process.env.VLY_INTEGRATION_KEY) {
      console.error("VLY_INTEGRATION_KEY is missing");
      return { success: false, error: "VLY_INTEGRATION_KEY is not set" };
    }

    try {
      const vly = new VlyIntegrations({
        token: process.env.VLY_INTEGRATION_KEY!,
      } as any);

      console.log("Sending test email to:", args.email);
      await vly.email.send({
        to: args.email,
        subject: "Health Companion: Integration Test",
        html: "<p>This email confirms that your Vly Integration is correctly configured for sending SOS alerts.</p>",
      });
      console.log("Test email sent successfully");

      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      console.error("Test email failed:", error);
      return { success: false, error: error.message || String(error) };
    }
  },
});
