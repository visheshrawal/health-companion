import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const logEvent = internalMutation({
  args: {
    userId: v.id("users"),
    contactName: v.string(),
    contactEmail: v.string(),
    location: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    status: v.string(),
    error: v.optional(v.string()),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sos_logs", args);
  },
});
