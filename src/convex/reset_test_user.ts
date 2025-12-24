import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const reset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
      return `Deleted user with email ${args.email}`;
    }
    
    return `User with email ${args.email} not found`;
  },
});
