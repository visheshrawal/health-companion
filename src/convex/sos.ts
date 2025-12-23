"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    if (!user.patientProfile?.emergencyContact?.phone) {
      throw new Error("No emergency contact configured. Please update your profile.");
    }

    const { name, phone } = user.patientProfile.emergencyContact;
    
    // Twilio Credentials - Set these in the Convex Dashboard > Settings > Environment Variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      throw new Error("Twilio configuration missing. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in the Convex Dashboard.");
    }

    // Use require to avoid build resolution issues with the twilio package
    const Twilio = require("twilio");
    const client = Twilio(accountSid, authToken);

    const message = `SOS ALERT: ${user.name} has triggered an SOS alert! \n\nLocation: ${args.location || "Unknown"}.\n\nPlease contact them immediately or send help.`;

    try {
      await client.messages.create({
        body: message,
        from: fromPhone,
        to: phone,
      });
      return { success: true, message: `SOS sent to ${name} (${phone})` };
    } catch (error: any) {
      console.error("Twilio error:", error);
      throw new Error("Failed to send SOS SMS: " + error.message);
    }
  },
});