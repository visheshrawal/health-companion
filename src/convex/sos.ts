"use node";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
// @ts-ignore
import { VlyIntegrations } from "@vly-ai/integrations";

export const trigger = action({
  args: {
    location: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    console.log(`[SOS] Triggered by user ${userId}`);

    const user: any = await ctx.runQuery(api.users.currentUser);
    
    if (!user) throw new Error("User not found");
    
    if (user.role !== "patient") {
       throw new Error("Only patients can trigger SOS");
    }

    if (!user.patientProfile?.emergencyContact?.email) {
      console.error(`[SOS] User ${userId} has no emergency contact email`);
      throw new Error("No emergency contact email configured. Please update your profile.");
    }

    const { name: contactName, email: contactEmail } = user.patientProfile.emergencyContact;
    
    if (!process.env.VLY_INTEGRATION_KEY) {
      console.error("[SOS] VLY_INTEGRATION_KEY is missing");
      throw new Error("System Error: VLY_INTEGRATION_KEY is not set");
    }

    try {
      const locationText = args.location ? `<p><strong>Location:</strong> <a href="${args.location}">${args.location}</a></p>` : "";
      const coordinatesText = args.latitude && args.longitude ? `<p>Coordinates: ${args.latitude}, ${args.longitude}</p>` : "";

      console.log(`[SOS] Sending email to ${contactEmail}`);
      
      // Use manual fetch to ensure correct endpoint and headers
      const url = "https://integrations.vly.ai/v1/email/send";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.VLY_INTEGRATION_KEY!.trim()}`,
          "X-Vly-Version": "0.1.0",
        },
        body: JSON.stringify({
          to: [contactEmail],
          from: "Health Companion <noreply@vly.io>",
          subject: `SOS: Emergency Alert from ${user.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h1 style="color: #ef4444;">SOS EMERGENCY ALERT</h1>
              <p><strong>${user.name}</strong> has triggered an emergency alert.</p>
              <p>Please contact them immediately or take appropriate action.</p>
              ${locationText}
              ${coordinatesText}
              <p>Time: ${new Date().toLocaleString()}</p>
              <hr />
              <p style="font-size: 12px; color: #666;">This is an automated message from Health Companion.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Error ${response.status}: ${text}`);
      }

      console.log(`[SOS] Email sent successfully to ${contactEmail}`);

      // Log success
      await ctx.runMutation(internal.sosLogs.logEvent, {
        userId,
        contactName,
        contactEmail,
        location: args.location,
        latitude: args.latitude,
        longitude: args.longitude,
        status: "sent",
        sentAt: Date.now(),
      });

      return { 
        success: true, 
        message: `🆘 Emergency alert sent to ${contactName}.` 
      };

    } catch (error: any) {
      console.error("[SOS] Failed to send email:", error);
      
      // Log failure
      await ctx.runMutation(internal.sosLogs.logEvent, {
        userId,
        contactName,
        contactEmail,
        location: args.location,
        latitude: args.latitude,
        longitude: args.longitude,
        status: "failed",
        error: error.message || String(error),
        sentAt: Date.now(),
      });

      throw new Error("Failed to send emergency alert. Please try again or call emergency services directly.");
    }
  },
});