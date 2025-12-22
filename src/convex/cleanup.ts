import { internalMutation } from "./_generated/server";

export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["users", "medications", "appointments", "prescriptions"];
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }
  },
});
