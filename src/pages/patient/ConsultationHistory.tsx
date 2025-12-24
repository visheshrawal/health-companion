import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, FileText, Play, Pause, Stethoscope, Pill, Activity, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useDemoMode } from "@/lib/demo";
import { DemoConsultation } from "@/components/DemoConsultation";

export default function ConsultationHistory() {
  const consultations = useQuery(api.consultations.listForPatient);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isDemoMode } = useDemoMode();

  const handlePlay = (url: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingId(null);
      audioRef.current = audio;
      setPlayingId(id);
    }
  };

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultation History</h1>
          <p className="text-muted-foreground">Review AI summaries and recordings from your past doctor visits.</p>
        </div>

        {isDemoMode && <DemoConsultation />}

        <div className="grid gap-6">
          {consultations === undefined ? (
            <div className="text-center py-12">Loading history...</div>
          ) : consultations.length === 0 ? (
            !isDemoMode && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No consultation history</p>
                  <p className="text-muted-foreground">Summaries will appear here after your appointments.</p>
                </CardContent>
              </Card>
            )
          ) : (
            consultations.map((consultation) => (
              <Card key={consultation._id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {format(consultation.appointmentDate || consultation.createdAt, "d")}
                      </div>
                      <div>
                        <CardTitle className="text-xl">Dr. {consultation.doctorName}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span className="font-medium text-primary">{consultation.doctorSpecialization}</span>
                          <span>•</span>
                          <span>{format(consultation.appointmentDate || consultation.createdAt, "MMMM yyyy")}</span>
                        </CardDescription>
                      </div>
                    </div>
                    {consultation.recordingUrl && (
                      <Button 
                        variant={playingId === consultation._id ? "secondary" : "outline"}
                        className="gap-2"
                        onClick={() => handlePlay(consultation.recordingUrl!, consultation._id)}
                      >
                        {playingId === consultation._id ? (
                          <><Pause className="h-4 w-4" /> Stop Recording</>
                        ) : (
                          <><Play className="h-4 w-4" /> Listen to Recording</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {consultation.summary ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                          <h3 className="font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                            <Activity className="h-4 w-4" /> Diagnosis & Assessment
                          </h3>
                          <p className="text-sm">{consultation.summary.diagnosis}</p>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                          <h3 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                            <Pill className="h-4 w-4" /> Treatment Plan
                          </h3>
                          <p className="text-sm">{consultation.summary.treatmentPlan}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                          <h3 className="font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                            <Stethoscope className="h-4 w-4" /> Doctor's Advice
                          </h3>
                          <p className="text-sm">{consultation.summary.advice}</p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                          <h3 className="font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-2">
                            <ArrowRight className="h-4 w-4" /> Next Steps
                          </h3>
                          <p className="text-sm">{consultation.summary.followUp}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Summary is being generated...
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PatientLayout>
  );
}