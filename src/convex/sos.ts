"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { VlyIntegrations } from "@vly-ai/integrations";

export const trigger = action({
  args: {
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user: any = await ctx.runQuery(api.users.currentUser);
    
    if (!user) throw new Error("User not found");
    
    if (user.role !== "patient") {
       throw new Error("Only patients can trigger SOS");
    }

    if (!user.patientProfile?.emergencyContact?.email) {
      throw new Error("No emergency contact email configured. Please update your profile.");
    }

    const { name, email } = user.patientProfile.emergencyContact;
    
    if (!process.env.VLY_INTEGRATION_KEY) {
      throw new Error("System Error: VLY_INTEGRATION_KEY is not set");
    }

    // Initialize Vly Integration
    const vly = new VlyIntegrations({
      token: process.env.VLY_INTEGRATION_KEY!,
    } as any);

    const subject = `🆘 EMERGENCY: ${user.name} needs help`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444; margin-bottom: 20px;">SOS ALERT</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          <strong>${user.name}</strong> has triggered an SOS alert from Health Companion at <strong>${new Date().toLocaleTimeString()}</strong>.
        </p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #991b1b;">Location:</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${args.location || "#"}" style="color: #dc2626; text-decoration: underline;">
              ${args.location || "Unknown Location"}
            </a>
          </p>
        </div>
        <p style="font-size: 16px; font-weight: bold;">Please check on them immediately.</p>
      </div>
    `;

    try {
      await vly.email.send({
        to: email,
        subject: subject,
        html: html,
      });
      return { success: true, message: `SOS email sent to ${name} (${email})` };
    } catch (error: any) {
      console.error("Email error:", error);
      throw new Error("Failed to send SOS email: " + (error.message || error));
    }
  },
});