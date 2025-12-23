import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listForPatient = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const consultations = await ctx.db
      .query("consultations")
      .withIndex("by_patient", (q) => q.eq("patientId", userId))
      .order("desc")
      .collect();

    // Enrich with doctor details and appointment date
    const enriched = await Promise.all(consultations.map(async (c) => {
      const doctor = await ctx.db.get(c.doctorId);
      const appointment = await ctx.db.get(c.appointmentId);
      let recordingUrl = null;
      if (c.recordingStorageId) {
        recordingUrl = await ctx.storage.getUrl(c.recordingStorageId);
      }
      return {
        ...c,
        doctorName: doctor?.name,
        doctorSpecialization: doctor?.doctorProfile?.specialization,
        appointmentDate: appointment?.date,
        recordingUrl
      };
    }));

    return enriched;
  },
});

export const getRecordingUrl = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const saveSummary = internalMutation({
  args: {
    appointmentId: v.id("appointments"),
    patientId: v.id("users"),
    doctorId: v.id("users"),
    recordingStorageId: v.optional(v.id("_storage")),
    summary: v.object({
      diagnosis: v.string(),
      treatmentPlan: v.string(),
      advice: v.string(),
      followUp: v.string(),
    }),
    transcript: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if exists
    const existing = await ctx.db
      .query("consultations")
      .withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        summary: args.summary,
        transcript: args.transcript,
        recordingStorageId: args.recordingStorageId || existing.recordingStorageId,
      });
    } else {
      await ctx.db.insert("consultations", {
        ...args,
        createdAt: Date.now(),
      });
    }
  },
});
