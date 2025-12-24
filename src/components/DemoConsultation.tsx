import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DEMO_CONSULTATION } from "@/lib/demo";
import { Sparkles, FileText, Activity, Pill, ArrowRight, Loader2, CheckCircle2, AlertTriangle, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function DemoConsultation() {
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  
  const simplify = useAction(api.ai.simplifyConsultation);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const summaryText = `
        Assessment: ${DEMO_CONSULTATION.assessment}
        Treatment Plan: ${DEMO_CONSULTATION.treatmentPlan}
        Doctor's Notes: ${DEMO_CONSULTATION.doctorNotes}
        Next Steps: ${DEMO_CONSULTATION.nextSteps}
      `;
      
      const result = await simplify({ summary: summaryText });
      setAiSummary(result);
      toast.success("AI Summary Generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI summary");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = (checked: boolean) => {
    setIsPublished(checked);
    if (checked) {
      toast.success("Saved to your health records (Demo)");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">📋 Consultation History</h2>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">📱 Demo Data</Badge>
      </div>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-muted/20 pb-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Consultation Summary - Dr. {DEMO_CONSULTATION.doctorName}</CardTitle>
              <CardDescription>
                Date: {DEMO_CONSULTATION.date} | Duration: {DEMO_CONSULTATION.duration}
              </CardDescription>
            </div>
            {aiSummary && (
              <div className="flex items-center gap-2 bg-background p-2 rounded-lg border shadow-sm">
                <Switch id="publish-demo" checked={isPublished} onCheckedChange={handlePublish} />
                <Label htmlFor="publish-demo" className="text-sm cursor-pointer">
                  📤 Include in my health records
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Original Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                  <Activity className="h-4 w-4" /> Assessment
                </h3>
                <p className="text-sm">{DEMO_CONSULTATION.assessment}</p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                <h3 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                  <Pill className="h-4 w-4" /> Treatment Plan
                </h3>
                <p className="text-sm">{DEMO_CONSULTATION.treatmentPlan}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                <h3 className="font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                  <FileText className="h-4 w-4" /> Doctor's Notes
                </h3>
                <p className="text-sm">"{DEMO_CONSULTATION.doctorNotes}"</p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                <h3 className="font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-2">
                  <ArrowRight className="h-4 w-4" /> Next Steps
                </h3>
                <p className="text-sm">{DEMO_CONSULTATION.nextSteps}</p>
              </div>
            </div>
          </div>

          {/* AI Section */}
          {!aiSummary ? (
            <div className="flex justify-center pt-4 border-t">
              <Button onClick={handleGenerate} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isLoading ? "Analyzing..." : "🤖 See AI-Powered Version"}
              </Button>
            </div>
          ) : (
            <div className="mt-8 border-t pt-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-primary">
                <Sparkles className="h-5 w-5" /> AI Simplified Summary
              </h3>
              
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-primary mb-2">What This Means For You:</h4>
                  <p className="text-foreground/90">{aiSummary.explanation}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background p-4 rounded-lg border shadow-sm">
                    <h5 className="font-medium flex items-center gap-2 mb-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> Action Items
                    </h5>
                    <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                      {aiSummary.actionItems?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-background p-4 rounded-lg border shadow-sm">
                    <h5 className="font-medium flex items-center gap-2 mb-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" /> Watch Out For
                    </h5>
                    <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                      {aiSummary.warningSigns?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-background p-4 rounded-lg border shadow-sm">
                    <h5 className="font-medium flex items-center gap-2 mb-2 text-blue-600">
                      <ThumbsUp className="h-4 w-4" /> You're Doing Great!
                    </h5>
                    <p className="text-sm text-muted-foreground italic">
                      "{aiSummary.encouragement}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
