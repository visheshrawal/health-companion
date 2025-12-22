import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "./schema";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    role: v.optional(v.string()), // "patient" or "doctor"
    // Patient fields
    age: v.optional(v.number()),
    conditions: v.optional(v.array(v.string())),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
    })),
    // Doctor fields
    specialization: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // If setting role, validate it
    if (args.role && args.role !== ROLES.PATIENT && args.role !== ROLES.DOCTOR) {
      throw new Error("Invalid role");
    }

    // Cast role to the correct type for the patch
    const patchData: any = { ...args };
    
    await ctx.db.patch(userId, patchData);
  },
});

export const listDoctors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", ROLES.DOCTOR))
      .collect();
  },
});