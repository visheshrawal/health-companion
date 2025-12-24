import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, ArrowRight, ArrowLeft, Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useDemoMode, DEMO_DOCTORS } from "@/lib/demo";

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctors: any[];
  selectedDoctor: any;
  setSelectedDoctor: (doctor: any) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedSlot: number | null;
  setSelectedSlot: (slot: number | null) => void;
  bookingReason: string;
  setBookingReason: (reason: string) => void;
  slots: any[];
  handleBook: (additionalData?: any) => void;
}

export function BookAppointmentDialog({
  open,
  onOpenChange,
  doctors,
  selectedDoctor,
  setSelectedDoctor,
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
  bookingReason,
  setBookingReason,
  slots,
  handleBook
}: BookAppointmentDialogProps) {
  const { isDemoMode } = useDemoMode();
  const [useAI, setUseAI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [aiData, setAiData] = useState<any>(null);

  const generateSummary = useAction(api.ai.generateAppointmentSummary);

  const handleGenerateSummary = async () => {
    if (!bookingReason.trim()) return;
    
    setIsGenerating(true);
    try {
      const result = await generateSummary({ description: bookingReason });
      setAiSummary(result.summary);
      setAiData(result);
      setUseAI(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onBookClick = () => {
    handleBook({
      patientDescription: bookingReason,
      aiEnhancedSummary: aiSummary || undefined,
      showOriginalToDoctor: showOriginal,
      symptomSeverity: aiData?.symptomSeverity,
      suggestedPriority: aiData?.suggestedPriority
    });
  };

  const displayDoctors = isDemoMode ? [...(doctors || []), ...DEMO_DOCTORS] : (doctors || []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedDoctor ? `Book with Dr. ${selectedDoctor.name}` : "Find a Doctor"}</DialogTitle>
          <DialogDescription>
            {selectedDoctor ? "Select a date, time, and provide details for your visit." : "Choose a doctor to view available times."}
          </DialogDescription>
        </DialogHeader>

        {!selectedDoctor ? (
          <div className="grid gap-4 py-4">
            {displayDoctors.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setSelectedDoctor(doc)}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                    {doc.imageUrl ? (
                      <img src={doc.imageUrl} alt={doc.name} className="h-full w-full object-cover" />
                    ) : (
                      doc.name?.[0]
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Dr. {doc.name} 
                      {doc._id.toString().startsWith('demo_') && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">Demo</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{doc.doctorProfile?.specialization || "General Practice"}</p>
                    <p className="text-xs text-muted-foreground">{doc.doctorProfile?.affiliation}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
              </div>
            ))}
            {displayDoctors.length === 0 && <p className="text-center text-muted-foreground">No doctors found.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedDoctor(null); setSelectedDate(undefined); setSelectedSlot(null); setBookingReason(""); setAiSummary(null); setUseAI(false); }} className="self-start -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Doctors
            </Button>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" /> Select Date
                </h3>
                <div className="border rounded-lg p-4 flex justify-center bg-card/50">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    className="rounded-md border shadow"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Select Time
                </h3>
                {!selectedDate ? (
                  <div className="flex items-center justify-center h-[300px] border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                    Select a date to view slots
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {selectedDoctor._id.toString().startsWith('demo_') ? (
                      // Demo slots
                      [9, 10, 11, 14, 15, 16].map(hour => {
                        const date = new Date(selectedDate);
                        date.setHours(hour, 0, 0, 0);
                        return (
                          <Button
                            key={date.getTime()}
                            variant={selectedSlot === date.getTime() ? "default" : "outline"}
                            className="w-full text-xs h-9"
                            onClick={() => setSelectedSlot(date.getTime())}
                          >
                            {format(date, "h:mm a")}
                          </Button>
                        );
                      })
                    ) : (
                      slots ? (
                        slots.length > 0 ? (
                          slots.map((slot: any) => (
                            <Button
                              key={slot.date}
                              variant={selectedSlot === slot.date ? "default" : "outline"}
                              className={`
                                w-full text-xs h-9
                                ${!slot.available ? "opacity-50 cursor-not-allowed bg-muted" : ""}
                              `}
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot.date)}
                            >
                              {format(slot.date, "h:mm a")}
                            </Button>
                          ))
                        ) : (
                          <div className="col-span-3 text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                            No slots available on this date.
                          </div>
                        )
                      ) : (
                        <div className="col-span-3 text-center py-12">Loading slots...</div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedSlot && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 border-t pt-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Describe Your Issue</h3>
                  <Textarea
                    className="min-h-[100px] resize-none"
                    placeholder="Tell the doctor what's bothering you in your own words..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ai-help" 
                    checked={useAI}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleGenerateSummary();
                      } else {
                        setUseAI(false);
                        setAiSummary(null);
                      }
                    }}
                    disabled={!bookingReason.trim() || isGenerating}
                  />
                  <Label htmlFor="ai-help" className="flex items-center gap-2 cursor-pointer">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Help me describe this to the doctor
                  </Label>
                </div>

                {isGenerating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Generating medical summary...
                  </div>
                )}

                {useAI && aiSummary && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                        <Sparkles className="h-3 w-3" /> AI Medical Summary
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={() => setShowOriginal(!showOriginal)}
                      >
                        {showOriginal ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                        {showOriginal ? "Doctor sees original" : "Doctor sees summary only"}
                      </Button>
                    </div>
                    <p className="text-sm text-foreground/90 italic">
                      "{aiSummary}"
                    </p>
                    {aiData && (
                      <div className="flex gap-2 text-xs">
                        <span className="bg-background px-2 py-1 rounded border">Severity: {aiData.symptomSeverity}</span>
                        <span className="bg-background px-2 py-1 rounded border">Priority: {aiData.suggestedPriority}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {selectedDoctor && (
            <Button onClick={onBookClick} disabled={!selectedSlot || (useAI && isGenerating)}>
              Confirm Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}