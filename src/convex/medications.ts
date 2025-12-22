import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const add = mutation({
  args: {
    name: v.string(),
    dosage: v.string(),
    frequency: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.insert("medications", {
      userId,
      ...args,
      takenLog: [],
      active: true,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const toggleTaken = mutation({
  args: {
    medicationId: v.id("medications"),
    date: v.string(), // YYYY-MM-DD
    taken: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const med = await ctx.db.get(args.medicationId);
    if (!med || med.userId !== userId) throw new Error("Medication not found");

    let newLog = [...med.takenLog];
    if (args.taken) {
      if (!newLog.includes(args.date)) {
        newLog.push(args.date);
      }
    } else {
      newLog = newLog.filter((d) => d !== args.date);
    }

    await ctx.db.patch(args.medicationId, {
      takenLog: newLog,
    });
  },
});

export const getStreak = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const meds = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    if (meds.length === 0) return 0;

    // Simple streak calculation: check consecutive days backwards from today
    // This is a simplified version. A real one would be more complex.
    // We assume "streak" means all active meds were taken for that day.
    
    let streak = 0;
    const today = new Date();
    
    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Check if all active meds were taken on this date
      // Note: This logic assumes meds were active on that date. 
      // For MVP, we just check if the current active meds have this date in their log.
      const allTaken = meds.every(med => med.takenLog.includes(dateStr));
      
      if (allTaken) {
        streak++;
      } else {
        // If today is not taken yet, don't break streak if it's today (user might take it later)
        // But if it's yesterday and not taken, streak is broken.
        if (i === 0) {
           // If today is not fully taken, we don't count it, but we don't break if we are just checking history.
           // However, for "current streak", usually we count completed days.
           continue; 
        }
        break;
      }
    }
    
    return streak;
  },
});
