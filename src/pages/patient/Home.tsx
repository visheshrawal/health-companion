import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Flame, Calendar as CalendarIcon, LogOut, Sun, Moon, Sunset } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "react-router";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PatientHome() {
  const user = useQuery(api.users.currentUser);
  const medications = useQuery(api.medications.list);
  const appointments = useQuery(api.appointments.listForPatient);
  const streak = useQuery(api.medications.getStreak);
  const toggleTaken = useMutation(api.medications.toggleTaken);
  const sendSOS = useAction(api.sos.trigger);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const [isSendingSOS, setIsSendingSOS] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSOS = async () => {
    setIsSendingSOS(true);
    toast.info("Initiating Emergency Alert...");
    
    const executeSOS = async (locationData: any) => {
      try {
        const result = await sendSOS({
          location: locationData.location,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
        return result;
      } catch (error: any) {
        console.error("SOS Error:", error);
        throw new Error(error.message || "Failed to send SOS");
      }
    };

    if (!navigator.geolocation) {
      try {
        const result = await executeSOS({ location: "Location access not supported" });
        toast.success(result.message);
      } catch (error: any) {
        toast.error(error.message || "Failed to send SOS");
      } finally {
        setIsSendingSOS(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        try {
          const result = await executeSOS({ 
            location: locationLink,
            latitude,
            longitude
          });
          toast.success(result.message);
        } catch (error: any) {
          toast.error(error.message || "Failed to send SOS");
        } finally {
          setIsSendingSOS(false);
        }
      },
      async (error) => {
        console.error("Location error:", error);
        try {
          const result = await executeSOS({ location: "Location access denied or failed" });
          toast.success(result.message);
        } catch (err: any) {
          toast.error(err.message || "Failed to send SOS");
        } finally {
          setIsSendingSOS(false);
        }
      }
    );
  };

  const handleTakeMed = async (medId: any, time: string, status: string) => {
    await toggleTaken({ medicationId: medId, date: today, time, status });
    toast.success(status === "taken" ? "Medication taken!" : "Medication untaken");
  };

  const activeMeds = medications?.filter(m => m.active) || [];
  const upcomingAppointments = appointments?.filter(a => a.status === "scheduled" && a.date > Date.now()) || [];

  // Flatten schedule for today's view
  const todaysMeds = activeMeds.flatMap(med => {
    if (!med.schedule) return [];
    return med.schedule.map((s: any) => ({
      ...med,
      scheduleTime: s.time,
      scheduleDetails: s,
      isTaken: med.takenLog.some((log: any) => 
        typeof log !== 'string' && log.date === today && log.time === s.time && log.status === 'taken'
      )
    }));
  });

  // Sort by time (morning, afternoon, night)
  const timeOrder: Record<string, number> = { morning: 1, afternoon: 2, night: 3 };
  todaysMeds.sort((a, b) => (timeOrder[a.scheduleTime] || 4) - (timeOrder[b.scheduleTime] || 4));

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
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="shadow-lg shadow-destructive/20 animate-pulse" 
                  disabled={isSendingSOS}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {isSendingSOS ? "Sending..." : "SOS"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately send an emergency email alert to your registered emergency contact with your current location.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSOS} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Send SOS
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              {todaysMeds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active medications.</p>
              ) : (
                todaysMeds.map((med, idx) => (
                  <div key={`${med._id}-${med.scheduleTime}-${idx}`} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-secondary">
                        {med.scheduleTime === 'morning' && <Sun className="h-4 w-4 text-orange-500" />}
                        {med.scheduleTime === 'afternoon' && <Sunset className="h-4 w-4 text-orange-400" />}
                        {med.scheduleTime === 'night' && <Moon className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{med.scheduleTime} • {med.scheduleDetails.withFood}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={med.isTaken ? "default" : "outline"}
                      className={med.isTaken ? "bg-green-500 hover:bg-green-600" : ""}
                      onClick={() => handleTakeMed(med._id, med.scheduleTime, med.isTaken ? "missed" : "taken")}
                    >
                      {med.isTaken ? <Check className="h-4 w-4" /> : "Take"}
                    </Button>
                  </div>
                ))
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