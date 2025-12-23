"use node";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
// import { VlyIntegrations } from "@vly-ai/integrations"; // Temporarily disabled

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
    
    // Temporary: Skip Vly Integration to fix deployment
    /*
    if (!process.env.VLY_INTEGRATION_KEY) {
      console.error("[SOS] VLY_INTEGRATION_KEY is missing");
      throw new Error("System Error: VLY_INTEGRATION_KEY is not set");
    }

    const vly = new VlyIntegrations({
      token: process.env.VLY_INTEGRATION_KEY!,
    } as any);
    
    // ... email sending logic ...
    */

    console.log(`[SOS] Mocking email send to ${contactEmail}`);

    // Log success (Mock)
    await ctx.runMutation(internal.sosLogs.logEvent, {
      userId,
      contactName,
      contactEmail,
      location: args.location,
      latitude: args.latitude,
      longitude: args.longitude,
      status: "simulated",
      sentAt: Date.now(),
    });

    return { 
      success: true, 
      message: `🆘 Emergency alert simulated to ${contactName}.` 
    };
  },
});