import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const checkSetup = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Check Index
    try {
        await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();
    } catch (e: any) {
        return { success: false, error: "Index 'email' check failed: " + e.message };
    }

    return { success: true, message: "Index 'email' is working correctly." };
  },
});
