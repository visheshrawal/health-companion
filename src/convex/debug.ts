"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
// @ts-ignore
import { VlyIntegrations } from "@vly-ai/integrations";

async function sendVerificationRequest({ identifier: email, token }: { identifier: string, token: string }) {
  console.log(`[DEBUG] Sending verification code to ${email}`);
  const apiKey = process.env.VLY_INTEGRATION_KEY;
  
  if (!apiKey) {
    console.error("[DEBUG] VLY_INTEGRATION_KEY is not set");
    throw new Error("VLY_INTEGRATION_KEY is not set");
  }

  try {
    const { createVlyIntegrations } = await import("@vly-ai/integrations");
    const vly = createVlyIntegrations({
      deploymentToken: apiKey,
      debug: true,
    });

    const emailResult = await vly.email.send({
      to: email,
      subject: "Sign in to Health Companion",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2>Sign in to Health Companion</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 5px; background: #f4f4f5; padding: 10px; border-radius: 4px; display: inline-block;">${token}</h1>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `,
      text: `Your verification code for Health Companion is: ${token}`,
    });

    console.log(`[DEBUG] Email send result:`, emailResult);
    return emailResult;
  } catch (error) {
    console.error(`[DEBUG] Exception while sending email:`, error);
    throw error;
  }
}

export const testEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    console.log("Testing Vly Email Integration...");
    
    if (!process.env.VLY_INTEGRATION_KEY) {
      console.error("VLY_INTEGRATION_KEY is missing");
      return { success: false, error: "VLY_INTEGRATION_KEY is not set" };
    }

    try {
    const { createVlyIntegrations } = await import("@vly-ai/integrations");
    const vly = createVlyIntegrations({
      deploymentToken: process.env.VLY_INTEGRATION_KEY!,
      debug: true,
    });

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

export const checkEnv = action({
  args: {},
  handler: async (ctx) => {
    const siteUrl = process.env.CONVEX_SITE_URL;
    return {
      CONVEX_SITE_URL: siteUrl || "NOT_SET",
      IS_DEFAULT_SITE_URL: siteUrl === "https://your-convex-site.convex.cloud",
      VLY_INTEGRATION_KEY: process.env.VLY_INTEGRATION_KEY ? "SET" : "NOT_SET",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT_SET",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT_SET",
    };
  },
});