import { internalQuery } from "./_generated/server";

export const checkUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const issues = [];
    for (const user of users) {
      if (!user.email) {
        issues.push(`User ${user._id} has no email`);
      }
    }
    
    // Check for duplicate emails again just in case
    const emailMap = new Map<string, number>();
    for (const user of users) {
      if (user.email) {
        emailMap.set(user.email, (emailMap.get(user.email) || 0) + 1);
      }
    }
    
    const duplicates = [];
    for (const [email, count] of emailMap.entries()) {
      if (count > 1) {
        duplicates.push(email);
      }
    }

    return { 
      totalUsers: users.length, 
      usersWithoutEmail: issues,
      duplicateEmails: duplicates,
      message: issues.length === 0 && duplicates.length === 0 
        ? "User data integrity check passed." 
        : "Found issues in user data."
    };
  }
});
