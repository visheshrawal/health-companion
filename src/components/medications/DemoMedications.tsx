import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, X, Flame, Plus, Info } from "lucide-react";
import { DEMO_MEDICATIONS } from "@/lib/demo";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DemoMedications() {
  const [meds, setMeds] = useState(DEMO_MEDICATIONS);
  const [removing, setRemoving] = useState<Record<string, 'taken' | 'snoozed' | 'missed'>>({});

  const handleAction = (id: string, action: 'taken' | 'snoozed' | 'missed') => {
    // 1. Set removing state to trigger animation
    setRemoving(prev => ({ ...prev, [id]: action }));

    // 2. Show appropriate message
    if (action === 'taken') {
      toast.success("Great job! Medication taken.");
    } else if (action === 'snoozed') {
      toast.warning("Snoozed. We'll remind you again.");
    } else if (action === 'missed') {
      toast.error("Missed. Make sure to take it next time!");
    }

    // 3. Remove from list after animation completes
    setTimeout(() => {
      setMeds(prev => prev.filter(m => m._id !== id));
      setRemoving(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 600); // Slightly longer than transition to ensure smoothness
  };

  const handleAdd = () => {
    toast.info("In real use, your doctor's prescriptions appear here automatically!");
  };

  if (meds.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">📦 Sample Medications</h2>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">📱 Demo Data</Badge>
          </div>
          <Button onClick={() => setMeds(DEMO_MEDICATIONS)} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Reset Demo
          </Button>
        </div>
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
          <p className="text-muted-foreground">All demo medications processed for today!</p>
          <Button variant="link" onClick={() => setMeds(DEMO_MEDICATIONS)}>Reset Demo Data</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">📦 Sample Medications</h2>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">📱 Demo Data</Badge>
        </div>
        <Button onClick={handleAdd} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Your First Medicine
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {meds.map((med) => {
          const status = removing[med._id];
          
          return (
            <Card 
              key={med._id} 
              className={cn(
                "overflow-hidden border-l-4 border-l-primary transition-all duration-500 ease-in-out transform",
                status === 'taken' && "bg-green-100 dark:bg-green-900/30 border-green-500 opacity-0 translate-y-4 scale-95",
                status === 'snoozed' && "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 opacity-0 translate-x-4 scale-95",
                status === 'missed' && "bg-red-100 dark:bg-red-900/30 border-red-500 opacity-0 -translate-x-4 scale-95"
              )}
            >
              <CardHeader className="pb-2 bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{med.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{med.dosage} • {med.purpose}</p>
                  </div>
                  <div className="flex items-center gap-1 text-orange-500 text-xs font-bold bg-orange-100 px-2 py-1 rounded-full">
                    <Flame className="h-3 w-3" /> {med.streak} Day Streak
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>Day {med.progress.current} of {med.progress.total}</span>
                  </div>
                  <Progress value={(med.progress.current / med.progress.total) * 100} className="h-2" />
                </div>

                <div className="bg-secondary/50 p-3 rounded-md text-sm">
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Schedule
                  </p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {med.schedule.map((s, i) => (
                      <li key={i} className="capitalize flex justify-between">
                        <span>{s.time}</span>
                        <span>{s.withFood ? "With food" : "Empty stomach"}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 transition-colors" 
                    size="sm"
                    onClick={() => handleAction(med._id, "taken")}
                    disabled={!!status}
                  >
                    <Check className="h-4 w-4" /> Taken
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="hover:bg-yellow-100 hover:text-yellow-700 hover:border-yellow-300 transition-colors"
                    onClick={() => handleAction(med._id, "snoozed")}
                    disabled={!!status}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleAction(med._id, "missed")}
                    disabled={!!status}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}