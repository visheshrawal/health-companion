import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, BookOpen, Shield, FileText, Lock, Users, Star, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";
import { useDemoMode } from "@/lib/demo";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Must match backend definitions
const PATIENT_ACHIEVEMENTS_METADATA = [
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

const DOCTOR_ACHIEVEMENTS_METADATA = [
  {
    id: "practice_novice",
    title: "Dedicated Healer",
    subtitle: "1 Year Practice",
    description: "Practicing medicine for 1 year",
    icon: Medal,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    target: 1,
    progressKey: "years_practice"
  },
  {
    id: "practice_expert",
    title: "Experienced Practitioner",
    subtitle: "5 Years Practice",
    description: "Practicing medicine for 5 years",
    icon: Trophy,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    target: 5,
    progressKey: "years_practice"
  },
  {
    id: "patients_100",
    title: "Community Caretaker",
    subtitle: "100 Patients",
    description: "Treated 100 patients",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    target: 100,
    progressKey: "patients_treated"
  },
  {
    id: "patients_1000",
    title: "Medical Pillar",
    subtitle: "1,000 Patients",
    description: "Treated 1,000 patients",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    target: 1000,
    progressKey: "patients_treated"
  },
  {
    id: "research_contributor",
    title: "Research Contributor",
    subtitle: "First Upload",
    description: "Upload a research paper or professional document",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
    target: 1,
    progressKey: "reports_uploaded"
  }
];

interface AchievementsProps {
  role?: "patient" | "doctor";
}

export function Achievements({ role = "patient" }: AchievementsProps) {
  const data = useQuery(api.achievements.get);
  const prevUnlockedRef = useRef<string[]>([]);
  const { isDemoMode } = useDemoMode();
  const [demoUnlocked, setDemoUnlocked] = useState<string[]>([]);

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

  const handleSimulateUnlock = () => {
    const achievementsList = role === "doctor" ? DOCTOR_ACHIEVEMENTS_METADATA : PATIENT_ACHIEVEMENTS_METADATA;
    const locked = achievementsList.filter(a => !demoUnlocked.includes(a.id));
    
    if (locked.length > 0) {
      const random = locked[Math.floor(Math.random() * locked.length)];
      setDemoUnlocked(prev => [...prev, random.id]);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success(`Achievement Unlocked: ${random.title}!`);
    } else {
      toast.info("All demo achievements unlocked!");
    }
  };

  if (!data && !isDemoMode) return <div className="p-8 text-center text-muted-foreground">Loading achievements...</div>;

  const achievementsList = role === "doctor" ? DOCTOR_ACHIEVEMENTS_METADATA : PATIENT_ACHIEVEMENTS_METADATA;
  
  // Merge real data with demo data if in demo mode
  const unlocked = isDemoMode ? [...(data?.unlocked || []), ...demoUnlocked] : (data?.unlocked || []);
  const progress = isDemoMode ? { ...data?.progress, streak_days: 7, articles_read: 5 } : (data?.progress || {});
  const totalScore = isDemoMode ? (data?.totalScore || 0) + (demoUnlocked.length * 100) : (data?.totalScore || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {role === "doctor" ? "Professional Milestones" : "Achievements"}
          </h2>
          <p className="text-muted-foreground">
            {role === "doctor" 
              ? "Track your career progress and impact." 
              : "Track your health milestones and earn badges."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <Button size="sm" variant="outline" onClick={handleSimulateUnlock} className="mr-2">
              <Sparkles className="mr-2 h-4 w-4 text-yellow-500" /> Simulate Unlock
            </Button>
          )}
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">{totalScore} Points</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievementsList.map((achievement) => {
          const isUnlocked = unlocked.includes(achievement.id);
          const currentProgress = progress[achievement.progressKey] || 0;
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