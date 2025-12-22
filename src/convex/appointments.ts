import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const book = mutation({
  args: {
    doctorId: v.id("users"),
    date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.insert("appointments", {
      patientId: userId,
      doctorId: args.doctorId,
      date: args.date,
      status: "scheduled",
      notes: args.notes,
    });
  },
});

export const listForPatient = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patient", (q) => q.eq("patientId", userId))
      .collect();

    // Enrich with doctor details
    const enriched = await Promise.all(appointments.map(async (apt) => {
      const doctor = await ctx.db.get(apt.doctorId);
      return { ...apt, doctor };
    }));

    return enriched.sort((a, b) => a.date - b.date);
  },
});

export const listForDoctor = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctor", (q) => q.eq("doctorId", userId))
      .collect();

    // Enrich with patient details
    const enriched = await Promise.all(appointments.map(async (apt) => {
      const patient = await ctx.db.get(apt.patientId);
      return { ...apt, patient };
    }));

    return enriched.sort((a, b) => a.date - b.date);
  },
});

export const get = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const apt = await ctx.db.get(args.appointmentId);
    if (!apt) return null;

    if (apt.patientId !== userId && apt.doctorId !== userId) {
      return null; // Unauthorized
    }

    const patient = await ctx.db.get(apt.patientId);
    const doctor = await ctx.db.get(apt.doctorId);

    return { ...apt, patient, doctor };
  },
});
