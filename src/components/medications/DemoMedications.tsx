import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, X, Flame, Plus, Info } from "lucide-react";
import { DEMO_MEDICATIONS } from "@/lib/demo";
import { useState } from "react";
import { toast } from "sonner";

export function DemoMedications() {
  const [meds, setMeds] = useState(DEMO_MEDICATIONS);

  const handleAction = (id: string, action: string) => {
    toast.success(`Marked as ${action} (Demo)`);
  };

  const handleAdd = () => {
    toast.info("In real use, your doctor's prescriptions appear here automatically!");
  };

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
        {meds.map((med) => (
          <Card key={med._id} className="overflow-hidden border-l-4 border-l-primary">
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
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  size="sm"
                  onClick={() => handleAction(med._id, "Taken")}
                >
                  <Check className="h-4 w-4" /> Taken
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction(med._id, "Snoozed")}
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleAction(med._id, "Missed")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
