import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const records = await ctx.db
      .query("medicalRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return await Promise.all(records.map(async (record) => ({
      ...record,
      url: await ctx.storage.getUrl(record.storageId),
    })));
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    storageId: v.id("_storage"),
    format: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.insert("medicalRecords", {
      userId,
      ...args,
      uploadedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("medicalRecords") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const record = await ctx.db.get(args.id);
    if (!record || record.userId !== userId) throw new Error("Unauthorized");
    await ctx.storage.delete(record.storageId);
    await ctx.db.delete(args.id);
  },
});
