import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Stethoscope, AlertTriangle, CheckCircle2, AlertCircle, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface AnalysisResult {
  conditions: string[];
  urgency: "high" | "medium" | "low";
  urgencyLabel: string;
  recommendedActions: string[];
  summary: string;
}

export function SymptomChecker({ children }: { children: React.ReactNode }) {
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const analyzeSymptoms = useAction(api.ai.analyzeSymptoms);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const data = await analyzeSymptoms({ symptoms });
      setResult(data);
    } catch (error: any) {
      console.error(error);
      // Extract a more user-friendly message if possible
      let errorMessage = error.message || "Failed to analyze symptoms. Please try again.";
      
      // Clean up Convex error wrapping
      if (errorMessage.includes("Analysis failed:")) {
        errorMessage = errorMessage.split("Analysis failed:")[1].trim();
      }
      
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSymptoms("");
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "low": return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <Stethoscope className="h-6 w-6 text-primary" />
            AI Symptom Checker
          </SheetTitle>
          <SheetDescription>
            Describe your symptoms to receive a preliminary analysis.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {!result ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe your symptoms</label>
                <Textarea
                  placeholder="E.g., Headache for 3 days with fever and fatigue..."
                  className="min-h-[150px] resize-none text-base"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Be as detailed as possible about duration, severity, and other sensations.
                </p>
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleAnalyze} 
                disabled={!symptoms.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Stethoscope className="mr-2 h-4 w-4" /> Analyze Symptoms
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 p-3 rounded-lg flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-300 font-medium">
                  ⚠️ This is AI-generated information, not medical advice. Always consult a healthcare professional for diagnosis.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${getUrgencyColor(result.urgency)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-bold text-lg uppercase tracking-wide">{result.urgencyLabel}</h3>
                </div>
                <p className="text-sm opacity-90">{result.summary}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" /> Possible Conditions
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {result.conditions.map((condition, i) => (
                    <li key={i}>{condition}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Recommended Actions
                </h4>
                <ul className="space-y-2">
                  {result.recommendedActions.map((action, i) => (
                    <li key={i} className="text-sm bg-secondary/50 p-2 rounded-md border border-border/50">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 pt-4">
                {result.urgency === "high" && (
                  <Button variant="destructive" className="w-full" onClick={() => {
                    setIsOpen(false);
                    // Trigger SOS logic if needed, or navigate to home to trigger it
                    navigate("/patient");
                    toast.info("Please use the SOS button on the dashboard for emergencies.");
                  }}>
                    <Phone className="mr-2 h-4 w-4" /> Emergency SOS
                  </Button>
                )}
                
                <Button className="w-full" onClick={() => {
                  setIsOpen(false);
                  navigate("/patient/appointments");
                }}>
                  <Calendar className="mr-2 h-4 w-4" /> Book Doctor Appointment
                </Button>

                <Button variant="outline" onClick={handleReset}>
                  Check Another Symptom
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}