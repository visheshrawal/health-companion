import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Achievement Definitions
export const PATIENT_ACHIEVEMENTS = [
  {
    id: "consistency_champion_7",
    title: "Consistency Champion (Week)",
    description: "Maintain a 7-day medication streak",
    icon: "trophy",
    points: 50,
    type: "streak",
    target: 7
  },
  {
    id: "consistency_champion_30",
    title: "Consistency Champion (Month)",
    description: "Maintain a 30-day medication streak",
    icon: "medal",
    points: 150,
    type: "streak",
    target: 30
  },
  {
    id: "health_scholar",
    title: "Health Scholar",
    description: "Read 10 articles in Discover section",
    icon: "book",
    points: 100,
    type: "progress",
    target: 10,
    progressKey: "articles_read"
  },
  {
    id: "prevention_pro",
    title: "Prevention Pro",
    description: "Complete 5 preventive care tasks",
    icon: "shield",
    points: 100,
    type: "progress",
    target: 5,
    progressKey: "preventive_tasks"
  },
  {
    id: "report_master",
    title: "Report Master",
    description: "Upload your first medical report",
    icon: "file",
    points: 50,
    type: "one_time",
    target: 1,
    progressKey: "reports_uploaded"
  }
];

export const DOCTOR_ACHIEVEMENTS = [
  {
    id: "practice_novice",
    title: "Dedicated Healer",
    description: "Practicing medicine for 1 year",
    icon: "medal",
    points: 100,
    type: "time",
    target: 1
  },
  {
    id: "practice_expert",
    title: "Experienced Practitioner",
    description: "Practicing medicine for 5 years",
    icon: "trophy",
    points: 500,
    type: "time",
    target: 5
  },
  {
    id: "patients_100",
    title: "Community Caretaker",
    description: "Treated 100 patients",
    icon: "users",
    points: 200,
    type: "progress",
    target: 100,
    progressKey: "patients_treated"
  },
  {
    id: "patients_1000",
    title: "Medical Pillar",
    description: "Treated 1,000 patients",
    icon: "star",
    points: 1000,
    type: "progress",
    target: 1000,
    progressKey: "patients_treated"
  },
  {
    id: "research_contributor",
    title: "Research Contributor",
    description: "Upload a research paper or professional document",
    icon: "file",
    points: 150,
    type: "one_time",
    target: 1,
    progressKey: "reports_uploaded"
  }
];

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return user.achievements || {
      unlocked: [],
      progress: {},
      totalScore: 0
    };
  },
});

export const updateProgress = mutation({
  args: {
    key: v.string(), // e.g. "articles_read"
    value: v.optional(v.number()), // absolute value
    increment: v.optional(v.number()), // increment value
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    let achievements = user.achievements || {
      unlocked: [],
      progress: {
        patients_treated: 0, // Initialize default for doctors
        reports_uploaded: 0,
      },
      totalScore: 0,
    };

    // Update progress
    const currentVal = achievements.progress[args.key] || 0;
    let newVal = currentVal;
    
    if (args.value !== undefined) {
      newVal = args.value;
    } else if (args.increment !== undefined) {
      newVal += args.increment;
    }

    achievements.progress[args.key] = newVal;

    // Check for unlocks
    const newlyUnlocked: string[] = [];
    
    // Determine which set of achievements to check based on role
    const achievementSet = user.role === "doctor" ? DOCTOR_ACHIEVEMENTS : PATIENT_ACHIEVEMENTS;
    
    for (const achievement of achievementSet) {
      if (achievements.unlocked.includes(achievement.id)) continue;

      let unlocked = false;
      
      if (achievement.type === "progress" || achievement.type === "one_time") {
        if (achievement.progressKey === args.key && newVal >= achievement.target) {
          unlocked = true;
        }
      }
      // Streak logic is usually handled separately or passed as a value here
      if (achievement.type === "streak" && args.key === "streak_days" && newVal >= achievement.target) {
        unlocked = true;
      }

      if (unlocked) {
        achievements.unlocked.push(achievement.id);
        achievements.totalScore += achievement.points;
        newlyUnlocked.push(achievement.title);
      }
    }

    await ctx.db.patch(userId, { achievements });

    return newlyUnlocked; // Return titles of newly unlocked achievements for frontend celebration
  },
});