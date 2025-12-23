import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    patientId: v.id("users"),
    appointmentId: v.id("appointments"),
    followUpRequired: v.optional(v.boolean()),
    medications: v.array(v.object({
      name: v.string(),
      duration: v.number(),
      schedule: v.array(v.object({
        time: v.string(),
        withFood: v.string(),
        quantity: v.number(),
      })),
      instructions: v.optional(v.string()),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doctorId = await getAuthUserId(ctx);
    if (!doctorId) throw new Error("Unauthorized");

    // Create the prescription record
    const prescriptionId = await ctx.db.insert("prescriptions", {
      doctorId,
      patientId: args.patientId,
      appointmentId: args.appointmentId,
      medications: args.medications,
      notes: args.notes,
      followUpRequired: args.followUpRequired,
    });

    // Create individual medication records for the patient
    const startDate = Date.now();
    let maxDuration = 0;
    
    for (const med of args.medications) {
      const endDate = startDate + (med.duration * 24 * 60 * 60 * 1000);
      if (med.duration > maxDuration) maxDuration = med.duration;
      
      await ctx.db.insert("medications", {
        userId: args.patientId,
        name: med.name,
        startDate,
        endDate,
        duration: med.duration,
        schedule: med.schedule,
        instructions: med.instructions,
        takenLog: [],
        prescriptionId,
        active: true,
      });
    }

    // Schedule follow-up notification if required
    if (args.followUpRequired && maxDuration > 0) {
      const doctor = await ctx.db.get(doctorId);
      const delay = maxDuration * 24 * 60 * 60 * 1000;
      
      await ctx.scheduler.runAfter(delay, internal.prescriptions.sendFollowUpNotification, {
        patientId: args.patientId,
        doctorName: doctor?.name || "your doctor",
      });
    }

    // Update appointment status to completed? Optional, but good practice if prescribing
    // await ctx.db.patch(args.appointmentId, { status: "completed" });
    
    return prescriptionId;
  },
});

export const sendFollowUpNotification = internalMutation({
  args: {
    patientId: v.id("users"),
    doctorName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.patientId,
      title: "Follow-up Required",
      message: `Your medication course prescribed by Dr. ${args.doctorName} has ended. Please book a follow-up appointment.`,
      type: "info",
      read: false,
      createdAt: Date.now(),
      link: "/patient/appointments",
    });
  },
});