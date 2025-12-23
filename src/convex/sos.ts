"use node";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
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

    const user: any = await ctx.runQuery(api.users.currentUser);
    
    if (!user) throw new Error("User not found");
    
    if (user.role !== "patient") {
       throw new Error("Only patients can trigger SOS");
    }

    if (!user.patientProfile?.emergencyContact?.email) {
      throw new Error("No emergency contact email configured. Please update your profile.");
    }

    const { name: contactName, email: contactEmail } = user.patientProfile.emergencyContact;
    const patientName = user.name;
    const patientProfile = user.patientProfile;
    
    if (!process.env.VLY_INTEGRATION_KEY) {
      throw new Error("System Error: VLY_INTEGRATION_KEY is not set");
    }

    // Initialize Vly Integration
    const vly = new VlyIntegrations({
      token: process.env.VLY_INTEGRATION_KEY!,
    } as any);

    const currentTime = new Date().toLocaleString();
    const googleMapsLink = args.location || "Location not available";
    const latitude = args.latitude || "Unknown";
    const longitude = args.longitude || "Unknown";
    
    const patientConditions = patientProfile.conditions?.join(", ") || "None listed";
    const patientAllergies = patientProfile.allergies?.join(", ") || "None listed";
    const patientBloodGroup = patientProfile.bloodGroup || "Unknown";

    const subject = `🚨 EMERGENCY ALERT: ${patientName} needs immediate assistance`;
    
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444; margin-bottom: 20px; text-align: center;">URGENT: Health Companion SOS Alert</h1>
        
        <p style="font-size: 16px; line-height: 1.5;">
          Dear <strong>${contactName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.5;">
          This is an automated emergency alert from the Health Companion app.
        </p>

        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h2 style="font-size: 18px; color: #334155; margin-top: 0;">Patient Details:</h2>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Name:</strong> ${patientName}</li>
            <li style="margin-bottom: 8px;"><strong>Alert Time:</strong> ${currentTime}</li>
            <li style="margin-bottom: 8px;"><strong>Triggered:</strong> SOS Emergency Button</li>
          </ul>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <h2 style="font-size: 18px; color: #991b1b; margin-top: 0;">Patient's Last Known Location:</h2>
          <p style="margin: 10px 0;">
            📍 <a href="${googleMapsLink}" style="color: #dc2626; text-decoration: underline; font-weight: bold;">View on Google Maps</a>
          </p>
          <p style="margin: 5px 0; font-size: 14px; color: #7f1d1d;">
            (Approximate coordinates: ${latitude}, ${longitude})
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h2 style="font-size: 18px; color: #334155;">Immediate Action Required:</h2>
          <ul style="padding-left: 20px; line-height: 1.6;">
            <li>Please try to call <strong>${patientName}</strong> immediately</li>
            <li>If unable to reach them, proceed to the location above or contact local emergency services</li>
            <li>Inform other family members or caregivers</li>
          </ul>
        </div>

        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h2 style="font-size: 18px; color: #0369a1; margin-top: 0;">Additional Medical Context:</h2>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Known Conditions:</strong> ${patientConditions}</li>
            <li style="margin-bottom: 8px;"><strong>Allergies:</strong> ${patientAllergies}</li>
            <li style="margin-bottom: 8px;"><strong>Blood Group:</strong> ${patientBloodGroup}</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        
        <p style="font-size: 12px; color: #64748b; text-align: center;">
          This alert was triggered automatically. Please do not reply to this email.<br>
          For app support, contact: support@healthcompanion.app
        </p>
      </div>
    `;

    try {
      await vly.email.send({
        to: contactEmail,
        subject: subject,
        html: html,
      });

      // Log success
      await ctx.runMutation(internal.sosLogs.logEvent, {
        userId,
        contactName,
        contactEmail,
        location: googleMapsLink,
        latitude: typeof latitude === 'number' ? latitude : undefined,
        longitude: typeof longitude === 'number' ? longitude : undefined,
        status: "sent",
        sentAt: Date.now(),
      });

      return { 
        success: true, 
        message: `🆘 Emergency alert sent to ${contactName} at ${contactEmail}. Help is on the way.` 
      };
    } catch (error: any) {
      console.error("Email error:", error);
      
      // Log failure
      await ctx.runMutation(internal.sosLogs.logEvent, {
        userId,
        contactName,
        contactEmail,
        location: googleMapsLink,
        latitude: typeof latitude === 'number' ? latitude : undefined,
        longitude: typeof longitude === 'number' ? longitude : undefined,
        status: "failed",
        error: error.message || String(error),
        sentAt: Date.now(),
      });

      throw new Error("Failed to send SOS email: " + (error.message || error));
    }
  },
});