import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

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
  handleBook: () => void;
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
            {doctors?.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setSelectedDoctor(doc)}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {doc.name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold">Dr. {doc.name}</h3>
                    <p className="text-sm text-muted-foreground">{doc.doctorProfile?.specialization || "General Practice"}</p>
                    <p className="text-xs text-muted-foreground">{doc.doctorProfile?.affiliation}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
              </div>
            ))}
            {doctors?.length === 0 && <p className="text-center text-muted-foreground">No doctors found.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedDoctor(null); setSelectedDate(undefined); setSelectedSlot(null); setBookingReason(""); }} className="self-start -ml-2">
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
                    {slots ? (
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
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedSlot && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-medium">Reason for Visit / Symptoms</h3>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Please describe your symptoms or reason for booking..."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {selectedDoctor && (
            <Button onClick={handleBook} disabled={!selectedSlot}>
              Confirm Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
