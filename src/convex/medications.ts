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
    
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (meds.length === 0) return 0;

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
    
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
      return 0;
    }

    let currentDate = new Date(sortedDates[0]);
    
    for (let i = 0; i < sortedDates.length; i++) {
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

export const getAdherenceStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const meds = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    
    let totalExpected = 0;
    let totalTaken = 0;

    for (let d = 0; d < 30; d++) {
        const date = new Date(now - d * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        for (const med of meds) {
            if (med.startDate <= date.getTime() && (!med.endDate || med.endDate >= date.getTime())) {
                const expected = med.schedule?.length || 0;
                totalExpected += expected;

                const taken = med.takenLog.filter(log => {
                    if (typeof log === 'string') return log === dateStr;
                    return log.date === dateStr && log.status === 'taken';
                }).length;
                totalTaken += taken;
            }
        }
    }

    const monthlyAdherence = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 100;

    return {
        monthlyAdherence,
    };
  }
});

export const toggleTaken = mutation({
  args: {
    medicationId: v.id("medications"),
    date: v.string(),
    time: v.optional(v.string()),
    status: v.optional(v.string()),
    taken: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const med = await ctx.db.get(args.medicationId);
    if (!med || med.userId !== userId) throw new Error("Unauthorized");

    let newLog = [...med.takenLog];

    if (args.time) {
      const existingIndex = newLog.findIndex(entry => 
        typeof entry !== 'string' && entry.date === args.date && entry.time === args.time
      );

      if (existingIndex >= 0) {
        if (args.status) {
          (newLog[existingIndex] as any).status = args.status;
        } else {
          newLog.splice(existingIndex, 1);
        }
      } else {
        if (args.status) {
          newLog.push({
            date: args.date,
            time: args.time,
            status: args.status,
          });
        }
      }
    } else {
      const isTaken = newLog.some(l => typeof l === 'string' && l === args.date);
      if (args.taken && !isTaken) {
        newLog.push(args.date);
      } else if (!args.taken && isTaken) {
        newLog = newLog.filter(l => typeof l !== 'string' || l !== args.date);
      }
    }

    await ctx.db.patch(args.medicationId, { takenLog: newLog });

    const user = await ctx.db.get(userId);
    if (user) {
       let achievements = user.achievements || { unlocked: [], progress: {}, totalScore: 0 };
       achievements.progress["medications_taken"] = (achievements.progress["medications_taken"] || 0) + 1;
       await ctx.db.patch(userId, { achievements });
    }
  },
});