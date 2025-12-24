import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, MapPin, AlertCircle, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { format, addDays, startOfWeek, startOfDay } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";

export default function PatientAppointments() {
  const appointments = useQuery(api.appointments.listForPatient);
  const requestReschedule = useMutation(api.appointments.requestReschedule);
  const createAppointment = useMutation(api.appointments.create);
  const doctors = useQuery(api.users.listDoctors);
  
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [bookingReason, setBookingReason] = useState("");

  // Fetch slots when rescheduling or booking
  // For booking: we need selectedDoctor and selectedDate
  const slots = useQuery(api.appointments.getDoctorSlots, 
    (isBooking && selectedDoctor && selectedDate) ? { 
      doctorId: selectedDoctor._id, 
      date: selectedDate.getTime() 
    } : "skip"
  ) || [];

  // For rescheduling: we need selectedApt and selectedDate
  const rescheduleSlots = useQuery(api.appointments.getDoctorSlots,
    (isRescheduling && selectedApt && selectedDate) ? {
      doctorId: selectedApt.doctorId,
      date: selectedDate.getTime()
    } : "skip"
  ) || [];

  const handleReschedule = async () => {
    if (!selectedApt || !selectedSlot) return;
    
    try {
      await requestReschedule({
        appointmentId: selectedApt._id,
        newDate: selectedSlot,
        reason: "Patient requested change",
      });
      toast.success("Reschedule request sent to doctor");
      setIsRescheduling(false);
      setSelectedDate(undefined);
      setSelectedSlot(null);
    } catch (error) {
      toast.error("Failed to request reschedule");
    }
  };

  const handleBook = async (additionalData?: any) => {
    if (!selectedDoctor || !selectedSlot) return;
    try {
      await createAppointment({
        doctorId: selectedDoctor._id,
        date: selectedSlot,
        notes: bookingReason,
        ...additionalData
      });
      toast.success("Appointment booked successfully");
      setIsBooking(false);
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setBookingReason("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to book appointment");
    }
  };

  const upcomingAppointments = appointments?.filter(a => a.status === "scheduled" && a.date > Date.now()) || [];
  // Filter out cancelled appointments from past list
  const pastAppointments = appointments?.filter(a => (a.status === "completed" || a.date <= Date.now()) && a.status !== "cancelled") || [];

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">Manage your visits and consultations.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" /> Upcoming Visits
            </h2>
            <Button onClick={() => setIsBooking(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Book Appointment
            </Button>
          </div>
          
          <BookAppointmentDialog 
            open={isBooking}
            onOpenChange={(open) => {
              setIsBooking(open);
              if (!open) {
                setSelectedDoctor(null);
                setSelectedDate(undefined);
                setSelectedSlot(null);
                setBookingReason("");
              }
            }}
            doctors={doctors || []}
            selectedDoctor={selectedDoctor}
            setSelectedDoctor={setSelectedDoctor}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            bookingReason={bookingReason}
            setBookingReason={setBookingReason}
            slots={slots || []}
            handleBook={handleBook}
          />
          
          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No upcoming appointments</p>
                <p className="text-muted-foreground">Book a consultation with a doctor to get started.</p>
                <Button className="mt-4" variant="outline" onClick={() => setIsBooking(true)}>Find a Doctor</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingAppointments.map((apt) => (
                <Card key={apt._id} className="glass border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                          {apt.doctor?.imageUrl ? (
                            <img src={apt.doctor.imageUrl} alt={apt.doctor.name} className="h-full w-full object-cover" />
                          ) : (
                            apt.doctor?.name?.[0]
                          )}
                        </div>
                        <div>
                          <CardTitle>Dr. {apt.doctor?.name}</CardTitle>
                          <CardDescription>{apt.doctor?.doctorProfile?.specialization || "General Practice"}</CardDescription>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {format(apt.date, "d")}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{format(apt.date, "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(apt.date, "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{apt.doctor?.doctorProfile?.affiliation || "Medical Center"}</span>
                    </div>

                    {apt.rescheduleRequest && apt.rescheduleRequest.status === "pending" && (
                      <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-3 rounded-md text-sm flex items-start gap-2 mt-2">
                        <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">Reschedule Requested</p>
                          <p>Waiting for doctor approval for {format(apt.rescheduleRequest.newDate, "MMM d, h:mm a")}</p>
                        </div>
                      </div>
                    )}

                    {apt.rescheduleRequest && apt.rescheduleRequest.status === "rejected" && (
                      <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2 mt-2">
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">Request Denied</p>
                          <p>Doctor unavailable. Please try another time.</p>
                        </div>
                      </div>
                    )}

                    {apt.rescheduleRequest && apt.rescheduleRequest.status === "suggested" && (
                      <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-md text-sm flex items-start gap-2 mt-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">New Time Suggested</p>
                          <p>Doctor suggested: {format(apt.rescheduleRequest.suggestedDate!, "MMM d, h:mm a")}</p>
                          <Button 
                            size="sm" 
                            variant="link" 
                            className="p-0 h-auto text-blue-600 dark:text-blue-400 underline"
                            onClick={async () => {
                              if (apt.rescheduleRequest?.suggestedDate) {
                                try {
                                  await requestReschedule({
                                    appointmentId: apt._id,
                                    newDate: apt.rescheduleRequest.suggestedDate,
                                    reason: "Patient accepted suggestion",
                                  });
                                  toast.success("Suggestion accepted");
                                } catch (error) {
                                  toast.error("Failed to accept suggestion");
                                }
                              }
                            }}
                          >
                            Accept Suggestion
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Dialog open={isRescheduling && selectedApt?._id === apt._id} onOpenChange={(open) => {
                      setIsRescheduling(open);
                      if (open) setSelectedApt(apt);
                      else {
                        setSelectedApt(null);
                        setSelectedDate(undefined);
                        setSelectedSlot(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={apt.rescheduleRequest?.status === "pending"}>
                          {apt.rescheduleRequest?.status === "pending" ? "Request Pending" : "Request Time Change"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Reschedule Appointment</DialogTitle>
                          <DialogDescription>
                            Select a new date and time for your appointment with Dr. {apt.doctor?.name}.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex flex-col md:flex-row gap-6 py-4">
                          <div className="flex-1">
                            <div className="border rounded-lg p-4 flex justify-center">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                className="rounded-md border shadow"
                              />
                            </div>
                          </div>

                          <div className="flex-1 space-y-4">
                            <h3 className="font-medium">Available Slots</h3>
                            {!selectedDate ? (
                              <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-muted-foreground">
                                Select a date to view slots
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                                {rescheduleSlots ? (
                                  rescheduleSlots.length > 0 ? (
                                    rescheduleSlots.map((slot: any) => (
                                      <Button
                                        key={slot.date}
                                        variant={selectedSlot === slot.date ? "default" : "outline"}
                                        className={`
                                          w-full justify-start
                                          ${!slot.available ? "opacity-50 cursor-not-allowed bg-muted" : ""}
                                        `}
                                        disabled={!slot.available}
                                        onClick={() => setSelectedSlot(slot.date)}
                                      >
                                        <Clock className="mr-2 h-4 w-4" />
                                        {format(slot.date, "h:mm a")}
                                      </Button>
                                    ))
                                  ) : (
                                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                                      No slots available on this date.
                                    </div>
                                  )
                                ) : (
                                  <div className="col-span-2 text-center py-8">Loading slots...</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsRescheduling(false)}>Cancel</Button>
                          <Button onClick={handleReschedule} disabled={!selectedSlot}>
                            Send Change Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {pastAppointments.length > 0 && (
          <div className="space-y-4 pt-8">
            <h2 className="text-xl font-semibold text-muted-foreground">Past Appointments</h2>
            <div className="space-y-2">
              {pastAppointments.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 opacity-75">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                      {format(apt.date, "d")}
                    </div>
                    <div>
                      <p className="font-medium">Dr. {apt.doctor?.name}</p>
                      <p className="text-sm text-muted-foreground">{format(apt.date, "MMM d, yyyy • h:mm a")}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{apt.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}