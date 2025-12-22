import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";

export default function PatientAppointments() {
  const appointments = useQuery(api.appointments.listForPatient);
  const doctors = useQuery(api.users.listDoctors);
  const bookAppointment = useMutation(api.appointments.book);
  const cancelAppointment = useMutation(api.appointments.cancel);
  
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [notes, setNotes] = useState("");

  const handleBook = async () => {
    if (!date || !selectedDoctor) return;
    try {
      // Set time to 9 AM for simplicity in this MVP
      const appointmentDate = new Date(date);
      appointmentDate.setHours(9, 0, 0, 0);
      
      await bookAppointment({
        doctorId: selectedDoctor as any,
        date: appointmentDate.getTime(),
        notes,
      });
      toast.success("Appointment booked successfully");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to book appointment");
    }
  };

  const handleCancel = async (id: any) => {
    try {
      await cancelAppointment({ appointmentId: id });
      toast.success("Appointment cancelled");
    } catch (error) {
      toast.error("Failed to cancel appointment");
    }
  };

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Book New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Book Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Doctor</label>
                  <Select onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map((doc) => (
                        <SelectItem key={doc._id} value={doc._id}>
                          Dr. {doc.name} ({doc.specialization})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <div className="border rounded-md p-2 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea 
                    placeholder="Reason for visit..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleBook} className="w-full" disabled={!selectedDoctor || !date}>
                  Confirm Booking
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {appointments?.map((apt) => (
            <Card key={apt._id} className="glass">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {format(apt.date, "d")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Dr. {apt.doctor?.name}</h3>
                    <p className="text-muted-foreground">{apt.doctor?.specialization}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(apt.date, "MMMM yyyy • h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                    ${apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                      apt.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                      'bg-gray-100 text-gray-700'}`}>
                    {apt.status}
                  </div>
                  {apt.status === 'scheduled' && (
                    <Button variant="destructive" size="sm" onClick={() => handleCancel(apt._id)}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {appointments?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No appointments scheduled.
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}