import { internalMutation, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["users", "medications", "appointments", "prescriptions"];
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }
  },
});

export const resetAccountData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Delete medications
    const medications = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const med of medications) {
      await ctx.db.delete(med._id);
    }

    // Delete appointments (as patient)
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patient", (q) => q.eq("patientId", userId))
      .collect();
    for (const apt of appointments) {
      await ctx.db.delete(apt._id);
    }

    // Delete prescriptions (as patient)
    const prescriptions = await ctx.db
      .query("prescriptions")
      .withIndex("by_patient", (q) => q.eq("patientId", userId))
      .collect();
    for (const pres of prescriptions) {
      await ctx.db.delete(pres._id);
    }
    
    // Delete medical records
    const records = await ctx.db
      .query("medicalRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const record of records) {
        await ctx.db.delete(record._id);
    }
  },
});
