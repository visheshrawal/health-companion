import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    patientId: v.id("users"),
    appointmentId: v.id("appointments"),
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
    });

    // Create individual medication records for the patient
    const startDate = Date.now();
    
    for (const med of args.medications) {
      const endDate = startDate + (med.duration * 24 * 60 * 60 * 1000);
      
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

    // Update appointment status to completed? Optional, but good practice if prescribing
    // await ctx.db.patch(args.appointmentId, { status: "completed" });
    
    return prescriptionId;
  },
});