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

export const getStreak = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    
    // Simple streak calculation: consecutive days with at least one taken med
    // This is a simplified version. Real streak logic can be complex.
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (meds.length === 0) return 0;

    // Collect all unique dates where meds were taken
    const takenDates = new Set<string>();
    meds.forEach(med => {
      med.takenLog.forEach(log => {
        if (typeof log === 'string') {
          takenDates.add(log);
        } else if (log.status === 'taken') {
          takenDates.add(log.date);
        }
      });
    });

    const sortedDates = Array.from(takenDates).sort().reverse();
    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if streak is active (taken today or yesterday)
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
      return 0;
    }

    let currentDate = new Date(sortedDates[0]);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i];
      // Check if this date is consecutive
      // Simplified: just counting the sorted dates assuming no gaps in the set means consecutive? 
      // No, we need to check date diff.
      
      // Actually, let's just count backwards from today/yesterday
      // This is MVP logic
      streak++;
      
      if (i < sortedDates.length - 1) {
        const prevDate = new Date(sortedDates[i+1]);
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays > 1) break;
        currentDate = prevDate;
      }
    }
    
    return streak;
  },
});

export const toggleTaken = mutation({
  args: {
    medicationId: v.id("medications"),
    date: v.string(),
    time: v.optional(v.string()), // "morning", "afternoon", "night"
    status: v.optional(v.string()), // "taken", "missed"
    taken: v.optional(v.boolean()), // Legacy support
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const med = await ctx.db.get(args.medicationId);
    if (!med || med.userId !== userId) throw new Error("Unauthorized");

    let newLog = [...med.takenLog];

    if (args.time) {
      // New detailed tracking
      const existingIndex = newLog.findIndex(entry => 
        typeof entry !== 'string' && entry.date === args.date && entry.time === args.time
      );

      if (existingIndex >= 0) {
        // Update or remove
        if (args.status) {
          (newLog[existingIndex] as any).status = args.status;
        } else {
          // Toggle off if no status provided (legacy behaviorish)
          newLog.splice(existingIndex, 1);
        }
      } else {
        // Add
        if (args.status) {
          newLog.push({
            date: args.date,
            time: args.time,
            status: args.status,
          });
        }
      }
    } else {
      // Legacy simple toggle (date only)
      const isTaken = newLog.some(l => typeof l === 'string' && l === args.date);
      if (args.taken && !isTaken) {
        newLog.push(args.date);
      } else if (!args.taken && isTaken) {
        newLog = newLog.filter(l => typeof l !== 'string' || l !== args.date);
      }
    }

    await ctx.db.patch(args.medicationId, { takenLog: newLog });
  },
});