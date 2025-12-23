import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ChevronRight, LogOut, RefreshCw, Check, X, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";

export default function DoctorHome() {
  const user = useQuery(api.users.currentUser);
  const appointments = useQuery(api.appointments.listForDoctor);
  const resolveRequest = useMutation(api.appointments.resolveRescheduleRequest);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [suggestedDate, setSuggestedDate] = useState<string>("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleResolve = async (aptId: any, action: "approve" | "deny" | "suggest", date?: number) => {
    try {
      await resolveRequest({
        appointmentId: aptId,
        action,
        suggestedDate: date,
      });
      toast.success(`Request ${action}ed successfully`);
      setSuggestingId(null);
    } catch (error) {
      toast.error("Failed to process request");
    }
  };

  const today = new Date();
  const todaysAppointments = appointments?.filter(apt => 
    new Date(apt.date).toDateString() === today.toDateString()
  ) || [];

  const rescheduleRequests = appointments?.filter(apt => apt.rescheduleRequest?.status === "pending") || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dr. {user?.name}</h1>
            <p className="text-muted-foreground">Welcome back to your dashboard.</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Patients</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysAppointments.length}</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments?.filter(a => a.status === 'scheduled' && a.date < Date.now()).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className={`glass ${rescheduleRequests.length > 0 ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Change Requests</CardTitle>
              <RefreshCw className={`h-4 w-4 ${rescheduleRequests.length > 0 ? 'text-orange-500 animate-spin-slow' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rescheduleRequests.length}</div>
              {rescheduleRequests.length > 0 && <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Action required</p>}
            </CardContent>
          </Card>
        </div>

        {rescheduleRequests.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-500" />
                Appointment Change Requests
              </CardTitle>
              <CardDescription>Review and approve patient reschedule requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rescheduleRequests.map(apt => (
                <div key={apt._id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border bg-card/50 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold">
                      {apt.patient?.name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{apt.patient?.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground line-through">
                          <Calendar className="h-3 w-3" />
                          {format(apt.date, "MMM d, h:mm a")}
                        </div>
                        <ArrowRight className="h-3 w-3 hidden sm:block" />
                        <div className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                          <Calendar className="h-3 w-3" />
                          {format(apt.rescheduleRequest!.newDate, "MMM d, h:mm a")}
                        </div>
                      </div>
                      {apt.rescheduleRequest?.reason && (
                        <p className="text-xs text-muted-foreground mt-1">"{apt.rescheduleRequest.reason}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button size="sm" className="flex-1 md:flex-none bg-green-600 hover:bg-green-700" onClick={() => handleResolve(apt._id, "approve")}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Dialog open={suggestingId === apt._id} onOpenChange={(open) => setSuggestingId(open ? apt._id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1 md:flex-none">
                          Suggest Time
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Suggest Alternative Time</DialogTitle>
                          <DialogDescription>Propose a different time for {apt.patient?.name}.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <input 
                            type="datetime-local" 
                            className="w-full p-2 border rounded-md"
                            onChange={(e) => setSuggestedDate(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => {
                            if (suggestedDate) {
                              handleResolve(apt._id, "suggest", new Date(suggestedDate).getTime());
                            }
                          }}>Send Suggestion</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="destructive" className="flex-1 md:flex-none" onClick={() => handleResolve(apt._id, "deny")}>
                      <X className="h-4 w-4 mr-1" /> Deny
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="glass">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments?.map((apt) => (
                <Link key={apt._id} to={`/doctor/appointments/${apt._id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer mb-3">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {apt.patient?.name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{apt.patient?.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(apt.date, "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(apt.date, "h:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                        ${apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                          apt.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                          'bg-gray-100 text-gray-700'}`}>
                        {apt.status}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
              {appointments?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No appointments found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}