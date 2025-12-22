import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Flame, Calendar as CalendarIcon, LogOut } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "react-router";

export default function PatientHome() {
  const user = useQuery(api.users.currentUser);
  const medications = useQuery(api.medications.list);
  const appointments = useQuery(api.appointments.listForPatient);
  const streak = useQuery(api.medications.getStreak);
  const toggleTaken = useMutation(api.medications.toggleTaken);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleTakeMed = async (medId: any, taken: boolean) => {
    await toggleTaken({ medicationId: medId, date: today, taken });
    toast.success(taken ? "Medication taken!" : "Medication untaken");
  };

  const activeMeds = medications?.filter(m => m.active) || [];
  const upcomingAppointments = appointments?.filter(a => a.status === "scheduled" && a.date > Date.now()) || [];

  return (
    <PatientLayout>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hello, {user?.name?.split(' ')[0]}</h1>
            <p className="text-muted-foreground">Here's your health overview for today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
            <Button variant="destructive" className="shadow-lg shadow-destructive/20 animate-pulse" onClick={() => toast.error("SOS Alert Sent to Emergency Contacts!")}>
              <AlertCircle className="mr-2 h-4 w-4" />
              SOS
            </Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streak || 0} Days</div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Meds</CardTitle>
              <div className="h-4 w-4 rounded-full bg-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeMeds.length}</div>
              <p className="text-xs text-muted-foreground">Prescriptions active</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Visit</CardTitle>
              <CalendarIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {upcomingAppointments[0] ? format(upcomingAppointments[0].date, "MMM d") : "None"}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {upcomingAppointments[0] ? `Dr. ${upcomingAppointments[0].doctor?.name}` : "Schedule one"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle>Today's Medications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeMeds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active medications.</p>
              ) : (
                activeMeds.map((med) => {
                  const isTaken = med.takenLog.includes(today);
                  return (
                    <div key={med._id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isTaken ? "default" : "outline"}
                        className={isTaken ? "bg-green-500 hover:bg-green-600" : ""}
                        onClick={() => handleTakeMed(med._id, !isTaken)}
                      >
                        {isTaken ? <Check className="h-4 w-4" /> : "Take"}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="glass h-full">
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No upcoming appointments.</p>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div key={apt._id} className="flex items-center gap-4 p-3 rounded-lg border bg-card/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {format(apt.date, "d")}
                    </div>
                    <div>
                      <p className="font-medium">Dr. {apt.doctor?.name}</p>
                      <p className="text-sm text-muted-foreground">{format(apt.date, "MMMM yyyy • h:mm a")}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PatientLayout>
  );
}