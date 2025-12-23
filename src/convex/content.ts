import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getFeed = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    // Get user conditions for personalization
    const userConditions = user.patientProfile?.conditions || [];
    const normalizedConditions = userConditions.map(c => c.toLowerCase());

    // Fetch all content (in a real app, we would filter/paginate more efficiently)
    const allContent = await ctx.db.query("content").order("desc").take(50);

    // Get user's saved and liked content
    const saved = await ctx.db
      .query("saved_content")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const savedIds = new Set(saved.map(s => s.contentId));

    const likes = await ctx.db
      .query("content_likes")
      .withIndex("by_user_and_content", (q) => q.eq("userId", userId))
      .collect();
    const likedIds = new Set(likes.map(l => l.contentId));

    // Score and sort content
    const scoredContent = allContent.map(item => {
      let score = 0;
      
      // Personalization score
      const hasMatchingTag = item.tags.some(tag => 
        normalizedConditions.includes(tag.toLowerCase()) || tag.toLowerCase() === "general"
      );
      
      if (hasMatchingTag) score += 10;
      if (item.tags.includes("General")) score += 5;
      
      // Boost recent content
      const daysOld = (Date.now() - item.publishedAt) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 2;

      return {
        ...item,
        isSaved: savedIds.has(item._id),
        isLiked: likedIds.has(item._id),
        score
      };
    });

    // Sort by score desc, then date desc
    return scoredContent.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.publishedAt - a.publishedAt;
    });
  },
});

export const toggleSave = mutation({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("saved_content")
      .withIndex("by_user_and_content", (q) => q.eq("userId", userId).eq("contentId", args.contentId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // unsaved
    } else {
      await ctx.db.insert("saved_content", {
        userId,
        contentId: args.contentId,
        savedAt: Date.now(),
      });
      return true; // saved
    }
  },
});

export const toggleLike = mutation({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("content_likes")
      .withIndex("by_user_and_content", (q) => q.eq("userId", userId).eq("contentId", args.contentId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // unliked
    } else {
      await ctx.db.insert("content_likes", {
        userId,
        contentId: args.contentId,
        likedAt: Date.now(),
      });
      return true; // liked
    }
  },
});

// Admin function to seed initial content
export const seedContent = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("content").take(1);
    if (existing.length > 0) return; // Already seeded

    const initialContent = [
      {
        title: "Managing Diabetes: The Basics",
        type: "article",
        body: "Living with diabetes requires a comprehensive approach to health. Key pillars include monitoring blood sugar, maintaining a balanced diet rich in fiber and low in simple sugars, and regular physical activity. Consistency is key.",
        tags: ["Diabetes", "General"],
        source: "Mayo Clinic",
        imageUrl: "https://images.unsplash.com/photo-1576091160550-217358c7b818?auto=format&fit=crop&q=80&w=1000",
        publishedAt: Date.now(),
        author: "Dr. Sarah Smith"
      },
      {
        title: "5 Low-Sodium Recipes for Heart Health",
        type: "article",
        body: "Reducing sodium doesn't mean sacrificing flavor. Try these delicious alternatives using herbs, spices, and citrus to season your food. 1. Lemon Herb Chicken... 2. Garlic Roasted Veggies...",
        tags: ["Hypertension", "Heart Health"],
        source: "Heart Foundation",
        imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000",
        publishedAt: Date.now() - 86400000,
        author: "Chef Mike"
      },
      {
        title: "Did you know?",
        type: "tip",
        body: "Taking your medication at the same time every day can improve its effectiveness by up to 30% and helps you build a consistent habit.",
        tags: ["General", "Medication"],
        publishedAt: Date.now() - 172800000,
      },
      {
        title: "Gentle Yoga for Arthritis",
        type: "video",
        body: "A 5-minute routine to help reduce joint pain and improve flexibility. Suitable for beginners.",
        url: "https://www.youtube.com/watch?v=example",
        tags: ["Arthritis", "Exercise"],
        imageUrl: "https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=1000",
        publishedAt: Date.now() - 259200000,
        source: "Yoga With Adriene"
      },
      {
        title: "Understanding Blood Pressure Readings",
        type: "article",
        body: "Systolic vs Diastolic: What do the numbers mean? Systolic (top number) measures pressure when your heart beats. Diastolic (bottom number) measures pressure between beats.",
        tags: ["Hypertension", "General"],
        source: "CDC",
        imageUrl: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=1000",
        publishedAt: Date.now() - 400000000,
      }
    ];

    for (const item of initialContent) {
      await ctx.db.insert("content", item as any);
    }
  }
});