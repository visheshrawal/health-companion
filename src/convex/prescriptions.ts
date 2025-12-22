import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    patientId: v.id("users"),
    appointmentId: v.id("appointments"),
    notes: v.optional(v.string()),
    medications: v.array(v.object({
      name: v.string(),
      dosage: v.string(),
      frequency: v.string(),
      startDate: v.number(),
      endDate: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const doctorId = await getAuthUserId(ctx);
    if (!doctorId) throw new Error("Unauthorized");

    // Verify doctor owns the appointment
    const apt = await ctx.db.get(args.appointmentId);
    if (!apt || apt.doctorId !== doctorId) throw new Error("Unauthorized");

    // Create prescription
    const prescriptionId = await ctx.db.insert("prescriptions", {
      doctorId,
      patientId: args.patientId,
      appointmentId: args.appointmentId,
      notes: args.notes,
      medications: args.medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
      })),
    });

    // Automatically add medications to patient's list
    for (const med of args.medications) {
      await ctx.db.insert("medications", {
        userId: args.patientId,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        startDate: med.startDate,
        endDate: med.endDate,
        takenLog: [],
        prescriptionId,
        active: true,
      });
    }
    
    // Mark appointment as completed
    await ctx.db.patch(args.appointmentId, { status: "completed" });
    
    return prescriptionId;
  },
});
