import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Sun, Moon, Pill, CheckCircle, Clock, CalendarDays, TrendingUp, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdherenceCalendar } from "@/components/medications/AdherenceCalendar";
import { useDemoMode } from "@/lib/demo";
import { DemoMedications } from "@/components/medications/DemoMedications";

export default function PatientMedications() {
  const medications = useQuery(api.medications.list);
  const streak = useQuery(api.medications.getStreak);
  const stats = useQuery(api.medications.getAdherenceStats);
  const toggleTaken = useMutation(api.medications.toggleTaken);
  const { isDemoMode } = useDemoMode();

  const today = new Date().toISOString().split('T')[0];

  const handleTakeMed = async (medId: any, time: string, status: string) => {
    try {
      await toggleTaken({ 
        medicationId: medId, 
        date: today, 
        time, 
        status 
      });
      toast.success(`Medication marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update medication");
    }
  };

  const activeMeds = medications?.filter(m => m.active) || [];
  const completedMeds = medications?.filter(m => !m.active) || [];

  // Group active meds by time of day for "Today's Schedule"
  const getMedsForTime = (timeSlot: string) => {
    return activeMeds.filter(med => 
      med.schedule?.some((s: any) => s.time === timeSlot)
    );
  };

  const morningMeds = getMedsForTime("morning");
  const afternoonMeds = getMedsForTime("afternoon");
  const nightMeds = getMedsForTime("night");

  const isTaken = (med: any, timeSlot: string) => {
    return med.takenLog.some((log: any) => 
      typeof log !== 'string' && log.date === today && log.time === timeSlot && log.status === 'taken'
    );
  };

  return (
    <PatientLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Medications</h1>
            <p className="text-muted-foreground">Track your daily prescriptions and adherence.</p>
          </div>
        </div>

        {isDemoMode && <DemoMedications />}

        {/* Adherence Calendar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Weekly Adherence
          </h2>
          <AdherenceCalendar medications={medications || []} />
        </div>

        {/* Progress & Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{streak || 0} Days</p>
                <p className="text-xs text-muted-foreground">Keep it up!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Adherence</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.monthlyAdherence || 0}%</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Meds</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activeMeds.length}</p>
                <p className="text-xs text-muted-foreground">Prescriptions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Section A: Today's Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Today's Schedule
            </h2>
            
            <div className="space-y-6">
              {/* Morning */}
              {morningMeds.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Sun className="h-4 w-4" /> Morning
                  </div>
                  {morningMeds.map(med => {
                    const schedule = med.schedule?.find((s: any) => s.time === "morning");
                    const taken = isTaken(med, "morning");
                    return (
                      <Card key={`${med._id}-morning`} className={`transition-all ${taken ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200' : 'hover:border-primary/50'}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Checkbox 
                              checked={taken}
                              onCheckedChange={(checked) => handleTakeMed(med._id, "morning", checked ? "taken" : "missed")}
                              className="h-6 w-6"
                            />
                            <div>
                              <p className={`font-semibold ${taken ? 'line-through text-muted-foreground' : ''}`}>{med.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {schedule?.quantity} unit(s) • {schedule?.withFood}
                              </p>
                            </div>
                          </div>
                          {taken && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Afternoon */}
              {afternoonMeds.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Sun className="h-4 w-4" /> Afternoon
                  </div>
                  {afternoonMeds.map(med => {
                    const schedule = med.schedule?.find((s: any) => s.time === "afternoon");
                    const taken = isTaken(med, "afternoon");
                    return (
                      <Card key={`${med._id}-afternoon`} className={`transition-all ${taken ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200' : 'hover:border-primary/50'}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Checkbox 
                              checked={taken}
                              onCheckedChange={(checked) => handleTakeMed(med._id, "afternoon", checked ? "taken" : "missed")}
                              className="h-6 w-6"
                            />
                            <div>
                              <p className={`font-semibold ${taken ? 'line-through text-muted-foreground' : ''}`}>{med.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {schedule?.quantity} unit(s) • {schedule?.withFood}
                              </p>
                            </div>
                          </div>
                          {taken && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Night */}
              {nightMeds.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Moon className="h-4 w-4" /> Night
                  </div>
                  {nightMeds.map(med => {
                    const schedule = med.schedule?.find((s: any) => s.time === "night");
                    const taken = isTaken(med, "night");
                    return (
                      <Card key={`${med._id}-night`} className={`transition-all ${taken ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200' : 'hover:border-primary/50'}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Checkbox 
                              checked={taken}
                              onCheckedChange={(checked) => handleTakeMed(med._id, "night", checked ? "taken" : "missed")}
                              className="h-6 w-6"
                            />
                            <div>
                              <p className={`font-semibold ${taken ? 'line-through text-muted-foreground' : ''}`}>{med.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {schedule?.quantity} unit(s) • {schedule?.withFood}
                              </p>
                            </div>
                          </div>
                          {taken && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {activeMeds.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  No active medications scheduled for today.
                </div>
              )}
            </div>
          </div>

          {/* Section B: All Medications List */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" /> All Medications
            </h2>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="space-y-4 mt-4">
                {activeMeds.map(med => {
                  const daysCompleted = Math.floor((Date.now() - med.startDate) / (1000 * 60 * 60 * 24));
                  const totalDays = med.duration || 30;
                  const progress = Math.min(100, Math.max(0, (daysCompleted / totalDays) * 100));
                  
                  return (
                    <Card key={med._id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{med.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {med.schedule?.map((s: any, i: number) => (
                                <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-md capitalize">
                                  {s.time} ({s.withFood})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{daysCompleted} of {totalDays} days</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {activeMeds.length === 0 && <p className="text-center text-muted-foreground py-4">No active medications.</p>}
              </TabsContent>
              <TabsContent value="completed" className="space-y-4 mt-4">
                {completedMeds.map(med => (
                  <Card key={med._id} className="opacity-75">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{med.name}</h3>
                      <p className="text-sm text-muted-foreground">Completed on {med.endDate ? format(med.endDate, "MMM d, yyyy") : "Unknown"}</p>
                    </CardContent>
                  </Card>
                ))}
                {completedMeds.length === 0 && <p className="text-center text-muted-foreground py-4">No completed medications.</p>}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}