import { internalMutation, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const removeDuplicateUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const emailMap = new Map<string, any[]>();

    // Group users by email
    for (const user of users) {
      if (user.email) {
        const existing = emailMap.get(user.email) || [];
        existing.push(user);
        emailMap.set(user.email, existing);
      }
    }

    let deletedCount = 0;
    const deletedIds = [];

    for (const [email, userList] of emailMap.entries()) {
      if (userList.length > 1) {
        // Sort: Verified first, then by creation time (oldest first)
        // We keep the oldest verified user (likely the original account)
        userList.sort((a, b) => {
            // If verification status is different, prioritize verified
            if (a.emailVerified !== b.emailVerified) {
                return (b.emailVerified ? 1 : 0) - (a.emailVerified ? 1 : 0);
            }
            // If same verification status, prioritize older account (smaller creation time)
            return a._creationTime - b._creationTime;
        });

        // Keep the first one (index 0), delete the rest
        const [keep, ...remove] = userList;
        
        console.log(`Keeping user ${keep._id} for email ${email}, deleting ${remove.length} duplicates.`);

        for (const user of remove) {
          await ctx.db.delete(user._id);
          deletedIds.push(user._id);
          deletedCount++;
        }
      }
    }

    return {
      deletedCount,
      deletedIds,
      message: `Cleanup complete. Removed ${deletedCount} duplicate users.`
    };
  },
});

export const resetAccountData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Delete appointments
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patient", (q) => q.eq("patientId", userId))
      .collect();
    for (const apt of appointments) {
      await ctx.db.delete(apt._id);
    }

    // Delete medications
    const medications = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const med of medications) {
      await ctx.db.delete(med._id);
    }

    // Delete medical records
    const records = await ctx.db
      .query("medicalRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }

    // Delete notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const notif of notifications) {
      await ctx.db.delete(notif._id);
    }
  },
});