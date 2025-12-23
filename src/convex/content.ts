import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getFeed = query({
  args: { seed: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    // Get user conditions for personalization
    const userConditions = user.patientProfile?.conditions || [];
    const normalizedConditions = userConditions.map(c => c.toLowerCase());

    // Fetch all content (in a real app, we would filter/paginate more efficiently)
    const allContent = await ctx.db.query("content").order("desc").take(50);

    // Filter out invalid content (articles/videos must have a URL)
    const validContent = allContent.filter(item => {
      if (item.type === 'article' || item.type === 'video') {
        return item.url && item.url.length > 0;
      }
      return true;
    });

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
    const scoredContent = validContent.map(item => {
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

      // Randomize score if seed provided to keep feed fresh
      if (args.seed !== undefined) {
        // Simple pseudo-random based on seed and item creation time
        const randomVal = (Math.abs(Math.sin(args.seed + item._creationTime)) * 10); 
        score += randomVal;
      }

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
    const initialContent = [
      {
        title: "Managing Diabetes: The Basics",
        type: "article",
        body: "Living with diabetes requires a comprehensive approach to health. Key pillars include monitoring blood sugar, maintaining a balanced diet rich in fiber and low in simple sugars, and regular physical activity. Consistency is key.",
        tags: ["Diabetes", "General"],
        source: "Mayo Clinic",
        imageUrl: "https://images.unsplash.com/photo-1576091160550-217358c7b818?auto=format&fit=crop&q=80&w=1000",
        url: "https://www.mayoclinic.org/diseases-conditions/diabetes/symptoms-causes/syc-20371444",
        publishedAt: Date.now(),
        author: "Dr. Sarah Smith"
      },
      {
        title: "5 Low-Sodium Recipes for Heart Health",
        type: "article",
        body: "Reducing sodium doesn't mean sacrificing flavor. Try these delicious alternatives using herbs, spices, and citrus to season your food. 1. Lemon Herb Chicken... 2. Garlic Roasted Veggies... 3. Spicy Bean Chili...",
        tags: ["Hypertension", "Heart Health"],
        source: "Heart Foundation",
        imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000",
        url: "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium/low-sodium-recipes",
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
        url: "https://www.cdc.gov/bloodpressure/about.htm",
        publishedAt: Date.now() - 400000000,
      },
      {
        title: "The Benefits of Walking",
        type: "article",
        body: "Walking is a simple, low-impact way to improve your health. It can help lower blood pressure, improve mood, and support weight management.",
        tags: ["General", "Exercise"],
        source: "Healthline",
        imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=1000",
        url: "https://www.healthline.com/health/benefits-of-walking",
        publishedAt: Date.now() - 500000000,
      },
      {
        title: "Stay Hydrated",
        type: "tip",
        body: "Drinking enough water is crucial for many bodily functions, including regulating temperature and keeping joints lubricated.",
        tags: ["General", "Wellness"],
        publishedAt: Date.now() - 600000000,
      },
      {
        title: "Meditation for Stress Relief",
        type: "video",
        body: "A guided meditation to help you relax and reduce stress levels.",
        url: "https://www.youtube.com/watch?v=example2",
        tags: ["Mental Health", "Wellness"],
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000",
        publishedAt: Date.now() - 700000000,
        source: "Headspace"
      },
      {
        title: "Healthy Sleep Habits",
        type: "article",
        body: "Good sleep is essential for good health. Learn how to improve your sleep hygiene with these simple tips.",
        tags: ["General", "Sleep"],
        source: "Sleep Foundation",
        imageUrl: "https://images.unsplash.com/photo-1511295742362-92c96b504802?auto=format&fit=crop&q=80&w=1000",
        url: "https://www.sleepfoundation.org/sleep-hygiene",
        publishedAt: Date.now() - 800000000,
      },
      {
        title: "Quick Stress Buster",
        type: "tip",
        body: "Take 3 deep breaths. Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds. Repeat.",
        tags: ["Mental Health", "Stress"],
        publishedAt: Date.now() - 900000000,
      }
    ];

    // Fetch all existing content to check for updates
    const allExisting = await ctx.db.query("content").collect();
    const existingMap = new Map(allExisting.map(item => [item.title, item]));

    for (const item of initialContent) {
      const existing = existingMap.get(item.title);

      if (existing) {
        // Update if missing URL or Image, or just to ensure data is fresh
        // Also update if the URL in seed is different (e.g. we fixed a broken link)
        if ((!existing.url && item.url) || (item.url && existing.url !== item.url)) {
           await ctx.db.patch(existing._id, {
             url: item.url,
             imageUrl: item.imageUrl || existing.imageUrl,
             body: item.body,
             source: item.source
           });
        }
      } else {
        await ctx.db.insert("content", item as any);
      }
    }
  }
});