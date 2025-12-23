import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calendar, Clock, User, ArrowLeft, Plus, Trash2, Save, Mic, Square, Play, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appointment = useQuery(api.appointments.get, { appointmentId: id as Id<"appointments"> });
  const consultation = useQuery(api.consultations.getByAppointmentId, { appointmentId: id as Id<"appointments"> });
  const createPrescription = useMutation(api.prescriptions.create);
  const generateUploadUrl = useMutation(api.consultations.generateUploadUrl);
  const processRecording = useAction(api.ai.processConsultationRecording);

  const [isPrescribing, setIsPrescribing] = useState(false);
  const [medications, setMedications] = useState<any[]>([
    { 
      name: "", 
      duration: 30, 
      schedule: [], 
      instructions: "",
      tempSchedule: {
        morning: false,
        afternoon: false,
        night: false,
        withFood: "With Food",
        quantity: 1
      }
    }
  ]);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await handleUploadAndProcess(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleUploadAndProcess = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      // 1. Get Upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload File
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: blob,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      // 3. Process with AI
      toast.info("Processing recording with AI... This may take a moment.");
      await processRecording({
        appointmentId: id as Id<"appointments">,
        storageId,
      });
      
      toast.success("Consultation processed and summary generated!");
    } catch (error) {
      console.error("Error processing recording:", error);
      toast.error("Failed to process recording. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddMedication = () => {
    setMedications([...medications, { 
      name: "", 
      duration: 30, 
      schedule: [], 
      instructions: "",
      tempSchedule: {
        morning: false,
        afternoon: false,
        night: false,
        withFood: "With Food",
        quantity: 1
      }
    }]);
  };

  const handleRemoveMedication = (index: number) => {
    const newMeds = [...medications];
    newMeds.splice(index, 1);
    setMedications(newMeds);
  };

  const updateMedication = (index: number, field: string, value: any) => {
    const newMeds = [...medications];
    newMeds[index][field] = value;
    setMedications(newMeds);
  };

  const updateTempSchedule = (index: number, field: string, value: any) => {
    const newMeds = [...medications];
    newMeds[index].tempSchedule[field] = value;
    setMedications(newMeds);
  };

  const handleSavePrescription = async () => {
    if (!appointment) return;

    // Transform tempSchedule into actual schedule array
    const formattedMeds = medications.map(med => {
      const schedule = [];
      if (med.tempSchedule.morning) {
        schedule.push({ time: "morning", withFood: med.tempSchedule.withFood, quantity: parseInt(med.tempSchedule.quantity) });
      }
      if (med.tempSchedule.afternoon) {
        schedule.push({ time: "afternoon", withFood: med.tempSchedule.withFood, quantity: parseInt(med.tempSchedule.quantity) });
      }
      if (med.tempSchedule.night) {
        schedule.push({ time: "night", withFood: med.tempSchedule.withFood, quantity: parseInt(med.tempSchedule.quantity) });
      }
      
      return {
        name: med.name,
        duration: parseInt(med.duration),
        schedule,
        instructions: med.instructions
      };
    }).filter(m => m.name && m.schedule.length > 0);

    if (formattedMeds.length === 0) {
      toast.error("Please add at least one medication with a schedule");
      return;
    }

    try {
      await createPrescription({
        patientId: appointment.patientId,
        appointmentId: appointment._id,
        medications: formattedMeds,
        notes: "Prescription created via dashboard",
      });
      toast.success("Prescription saved successfully");
      setIsPrescribing(false);
    } catch (error) {
      toast.error("Failed to save prescription");
      console.error(error);
    }
  };

  if (appointment === undefined) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (appointment === null) {
    return <div className="p-8">Appointment not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Appointment Details</h1>
            <p className="text-muted-foreground">Manage patient visit and prescriptions.</p>
          </div>
          <div className="flex gap-2">
             <Dialog open={isPrescribing} onOpenChange={setIsPrescribing}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary text-primary-foreground">
                  Write Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Write Prescription</DialogTitle>
                  <DialogDescription>Create a medication plan for {appointment.patient?.name}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {medications.map((med, index) => (
                    <Card key={index} className="border-primary/20">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Medication {index + 1}</CardTitle>
                        {medications.length > 1 && (
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveMedication(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Medicine Name</Label>
                            <Input 
                              placeholder="e.g. Metformin 500mg" 
                              value={med.name}
                              onChange={(e) => updateMedication(index, "name", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration (Days)</Label>
                            <Input 
                              type="number" 
                              value={med.duration}
                              onChange={(e) => updateMedication(index, "duration", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Dosage Schedule</Label>
                          <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                            <div className="flex flex-wrap gap-6">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`morning-${index}`} 
                                  checked={med.tempSchedule.morning}
                                  onCheckedChange={(c) => updateTempSchedule(index, "morning", c)}
                                />
                                <Label htmlFor={`morning-${index}`}>Morning</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`afternoon-${index}`} 
                                  checked={med.tempSchedule.afternoon}
                                  onCheckedChange={(c) => updateTempSchedule(index, "afternoon", c)}
                                />
                                <Label htmlFor={`afternoon-${index}`}>Afternoon</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`night-${index}`} 
                                  checked={med.tempSchedule.night}
                                  onCheckedChange={(c) => updateTempSchedule(index, "night", c)}
                                />
                                <Label htmlFor={`night-${index}`}>Night</Label>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Instruction</Label>
                                <Select 
                                  value={med.tempSchedule.withFood} 
                                  onValueChange={(v) => updateTempSchedule(index, "withFood", v)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="With Food">With Food</SelectItem>
                                    <SelectItem value="Empty Stomach">Empty Stomach</SelectItem>
                                    <SelectItem value="After Food">After Food</SelectItem>
                                    <SelectItem value="Any Time">Any Time</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Quantity (Tablets/Units)</Label>
                                <Input 
                                  type="number" 
                                  value={med.tempSchedule.quantity}
                                  onChange={(e) => updateTempSchedule(index, "quantity", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Special Instructions</Label>
                          <Textarea 
                            placeholder="e.g. Avoid alcohol..." 
                            value={med.instructions}
                            onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outline" onClick={handleAddMedication} className="w-full border-dashed">
                    <Plus className="mr-2 h-4 w-4" /> Add Another Medicine
                  </Button>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPrescribing(false)}>Cancel</Button>
                  <Button onClick={handleSavePrescription}>
                    <Save className="mr-2 h-4 w-4" /> Save Prescription
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                    {appointment.patient?.name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{appointment.patient?.name}</h3>
                    <p className="text-muted-foreground">{appointment.patient?.email}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(appointment.date, "MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{format(appointment.date, "h:mm a")}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize font-medium">{appointment.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {appointment.notes && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{appointment.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* AI Consultation Summary Section */}
            {consultation?.summary && (
              <Card className="glass border-primary/20">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" /> Consultation Summary
                  </CardTitle>
                  <CardDescription>AI-generated summary from the consultation recording.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Diagnosis</h4>
                      <p className="text-sm">{consultation.summary.diagnosis}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Treatment Plan</h4>
                      <p className="text-sm">{consultation.summary.treatmentPlan}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advice</h4>
                      <p className="text-sm">{consultation.summary.advice}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Follow Up</h4>
                      <p className="text-sm">{consultation.summary.followUp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Recording Card */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" /> Consultation Recording
                </CardTitle>
                <CardDescription>Record the session to generate an AI summary.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground text-center">
                      Processing audio and generating summary...<br/>This may take a minute.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center py-6 bg-muted/30 rounded-lg border border-dashed">
                      {isRecording ? (
                        <div className="text-center space-y-2">
                          <div className="h-4 w-4 bg-red-500 rounded-full animate-pulse mx-auto" />
                          <div className="text-3xl font-mono font-bold">{formatTime(recordingTime)}</div>
                          <p className="text-xs text-muted-foreground">Recording in progress...</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-2 text-muted-foreground">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                            <Mic className="h-6 w-6" />
                          </div>
                          <p className="text-sm">Ready to record</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!isRecording ? (
                        <Button className="w-full" onClick={startRecording} disabled={!!consultation?.summary}>
                          {consultation?.summary ? "Session Recorded" : "Start Recording"}
                        </Button>
                      ) : (
                        <Button variant="destructive" className="w-full" onClick={stopRecording}>
                          <Square className="mr-2 h-4 w-4 fill-current" /> Stop & Process
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {consultation?.recordingUrl && !isRecording && !isProcessing && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Previous Recording</h4>
                    <audio controls src={consultation.recordingUrl} className="w-full h-8" />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* AI Enhanced Summary from Patient Booking */}
            {appointment.aiEnhancedSummary && (
              <Card className="glass border-purple-500/20">
                <CardHeader className="bg-purple-500/5 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-400">
                    <FileText className="h-4 w-4" /> Patient's Issue (AI Summary)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm italic">"{appointment.aiEnhancedSummary}"</p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {appointment.symptomSeverity && (
                      <div className="text-xs px-2 py-1 rounded-full bg-background border shadow-sm">
                        Severity: <span className="font-medium capitalize">{appointment.symptomSeverity}</span>
                      </div>
                    )}
                    {appointment.suggestedPriority && (
                      <div className="text-xs px-2 py-1 rounded-full bg-background border shadow-sm">
                        Priority: <span className="font-medium capitalize">{appointment.suggestedPriority}</span>
                      </div>
                    )}
                  </div>

                  {appointment.showOriginalToDoctor && appointment.patientDescription && (
                    <div className="pt-3 border-t mt-3">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Original Patient Description:</p>
                      <p className="text-xs text-muted-foreground">"{appointment.patientDescription}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}