import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, BookOpen, Shield, FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

// Must match backend definitions
const ACHIEVEMENTS_METADATA = [
  {
    id: "consistency_champion_7",
    title: "Consistency Champion",
    subtitle: "7 Day Streak",
    description: "Maintain a 7-day medication streak",
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    target: 7,
    progressKey: "streak_days"
  },
  {
    id: "consistency_champion_30",
    title: "Consistency Master",
    subtitle: "30 Day Streak",
    description: "Maintain a 30-day medication streak",
    icon: Medal,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    target: 30,
    progressKey: "streak_days"
  },
  {
    id: "health_scholar",
    title: "Health Scholar",
    subtitle: "Read 10 Articles",
    description: "Read 10 articles in Discover section",
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    target: 10,
    progressKey: "articles_read"
  },
  {
    id: "prevention_pro",
    title: "Prevention Pro",
    subtitle: "5 Tasks",
    description: "Complete 5 preventive care tasks",
    icon: Shield,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    target: 5,
    progressKey: "preventive_tasks"
  },
  {
    id: "report_master",
    title: "Report Master",
    subtitle: "First Upload",
    description: "Upload your first medical report",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
    target: 1,
    progressKey: "reports_uploaded"
  }
];

export function Achievements() {
  const data = useQuery(api.achievements.get);
  const prevUnlockedRef = useRef<string[]>([]);

  useEffect(() => {
    if (data?.unlocked) {
      // Check for new unlocks
      const newUnlocks = data.unlocked.filter(id => !prevUnlockedRef.current.includes(id));
      
      if (newUnlocks.length > 0 && prevUnlockedRef.current.length > 0) {
        // Only fire confetti if it's a new update (not initial load)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      prevUnlockedRef.current = data.unlocked;
    }
  }, [data?.unlocked]);

  if (!data) return <div className="p-8 text-center text-muted-foreground">Loading achievements...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Achievements</h2>
          <p className="text-muted-foreground">Track your health milestones and earn badges.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold text-primary">{data.totalScore} Points</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACHIEVEMENTS_METADATA.map((achievement) => {
          const isUnlocked = data.unlocked.includes(achievement.id);
          const currentProgress = data.progress[achievement.progressKey] || 0;
          const progressPercent = Math.min(100, (currentProgress / achievement.target) * 100);

          return (
            <Card key={achievement.id} className={`transition-all ${isUnlocked ? 'border-primary/50 shadow-sm' : 'opacity-80 grayscale-[0.5] hover:grayscale-0'}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? achievement.bgColor : 'bg-muted'}`}>
                    {isUnlocked ? (
                      <achievement.icon className={`h-6 w-6 ${achievement.color}`} />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-xs text-muted-foreground">{achievement.subtitle}</p>
                      </div>
                      {isUnlocked && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.min(currentProgress, achievement.target)} / {achievement.target}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}