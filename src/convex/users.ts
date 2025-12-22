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

    // If user has an image (storageId), get the URL
    let imageUrl = null;
    if (user.image) {
      imageUrl = await ctx.storage.getUrl(user.image as any);
    }

    return { ...user, imageUrl };
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
    image: v.optional(v.string()),
    role: v.optional(v.string()), // "patient" or "doctor"
    profileCompleted: v.optional(v.boolean()),
    
    // Patient fields
    patientProfile: v.optional(v.object({
      dateOfBirth: v.string(),
      sex: v.optional(v.string()),
      bloodGroup: v.optional(v.string()),
      conditions: v.array(v.string()),
      allergies: v.array(v.string()),
      emergencyContact: v.object({
        name: v.string(),
        phone: v.string(),
      }),
    })),

    // Doctor fields
    doctorProfile: v.optional(v.object({
      specialization: v.string(),
      licenseNumber: v.optional(v.string()),
      affiliation: v.optional(v.string()),
      bio: v.string(),
      isVerified: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // If setting role, validate it
    if (args.role && args.role !== ROLES.PATIENT && args.role !== ROLES.DOCTOR) {
      throw new Error("Invalid role");
    }

    const patchData: any = { ...args };
    
    // Map legacy fields for backward compatibility if needed, or just rely on new objects
    if (args.patientProfile) {
      patchData.age = new Date().getFullYear() - new Date(args.patientProfile.dateOfBirth).getFullYear();
      patchData.conditions = args.patientProfile.conditions;
      patchData.emergencyContact = args.patientProfile.emergencyContact;
    }
    
    if (args.doctorProfile) {
      patchData.specialization = args.doctorProfile.specialization;
      patchData.bio = args.doctorProfile.bio;
    }

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

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const deleteUserByName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .collect();
    
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    return users.length;
  },
});

export const deleteUserById = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});