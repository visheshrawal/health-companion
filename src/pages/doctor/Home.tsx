import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ChevronRight, LogOut, RefreshCw, Check, X, ArrowRight, Flag, Filter, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
function SortableAppointmentItem({ apt, handlePriorityChange }: { apt: any, handlePriorityChange: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: apt._id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border transition-colors mb-3 touch-none
      ${apt.priority === 'high' ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900' : 'bg-card/50 hover:bg-accent/50'}
    `}>
      <Link to={`/doctor/appointments/${apt._id}`} className="flex-1 flex items-center gap-4 cursor-pointer w-full">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
          {apt.patient?.imageUrl ? (
            <img src={apt.patient.imageUrl} alt={apt.patient?.name} className="h-full w-full object-cover" />
          ) : (
            apt.patient?.name?.[0]
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{apt.patient?.name}</h3>
            {apt.priority === 'high' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">High Priority</span>}
          </div>
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
      </Link>
      
      <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <Select 
            defaultValue={apt.priority || "low"} 
            onValueChange={(val: any) => handlePriorityChange(apt._id, val)}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🔴 High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize
          ${apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
            apt.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
            'bg-gray-100 text-gray-700'}`}>
          {apt.status}
        </div>
        <Link to={`/doctor/appointments/${apt._id}`}>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

export default function DoctorHome() {
  const user = useQuery(api.users.currentUser);
  const appointments = useQuery(api.appointments.listForDoctor);
  const resolveRequest = useMutation(api.appointments.resolveRescheduleRequest);
  const updatePriority = useMutation(api.appointments.updatePriority);
  const updateOrder = useMutation(api.appointments.updateOrder);
  const updateProfile = useMutation(api.users.updateProfile);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [suggestedDate, setSuggestedDate] = useState<string>("");
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);
  const [localAppointments, setLocalAppointments] = useState<any[]>([]);
  
  // Availability State
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [availDays, setAvailDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  useEffect(() => {
    if (user?.doctorProfile?.availability) {
      setAvailDays(user.doctorProfile.availability.days);
      setStartTime(user.doctorProfile.availability.startTime);
      setEndTime(user.doctorProfile.availability.endTime);
    }
  }, [user]);

  useEffect(() => {
    if (appointments) {
      setLocalAppointments(appointments);
    }
  }, [appointments]);

  const toggleDay = (day: string) => {
    if (availDays.includes(day)) {
      setAvailDays(availDays.filter(d => d !== day));
    } else {
      setAvailDays([...availDays, day]);
    }
  };

  const handleSaveAvailability = async () => {
    if (!user?.doctorProfile) return;
    
    try {
      await updateProfile({
        doctorProfile: {
          ...user.doctorProfile,
          availability: {
            days: availDays,
            startTime,
            endTime,
          }
        }
      });
      setIsAvailabilityOpen(false);
      toast.success("Availability updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update availability");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalAppointments((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order in backend
        const updates = newItems.map((item: any, index: number) => ({
          id: item._id,
          order: index,
        }));
        updateOrder({ updates });
        
        return newItems;
      });
    }
  };

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

  const handlePriorityChange = async (aptId: any, priority: "high" | "medium" | "low") => {
    try {
      await updatePriority({ appointmentId: aptId, priority });
      toast.success(`Priority updated to ${priority}`);
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };

  if (user === undefined || appointments === undefined) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const today = new Date();
  const todaysAppointments = appointments?.filter(apt => 
    new Date(apt.date).toDateString() === today.toDateString()
  ) || [];

  const rescheduleRequests = appointments?.filter(apt => apt.rescheduleRequest?.status === "pending") || [];

  // Filter Appointments for display
  const filteredAppointments = (localAppointments || []).filter(apt => {
    if (showHighPriorityOnly) return apt.priority === "high";
    return true;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dr. {user?.name}</h1>
            <p className="text-muted-foreground">Welcome back to your dashboard.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Clock className="mr-2 h-4 w-4" /> Availability
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Availability</DialogTitle>
                  <DialogDescription>Configure your working days and hours.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Working Days</Label>
                    <div className="flex flex-wrap gap-4">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`day-${day}`} 
                            checked={availDays.includes(day)}
                            onCheckedChange={() => toggleDay(day)}
                          />
                          <label htmlFor={`day-${day}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input 
                        id="startTime" 
                        type="time" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input 
                        id="endTime" 
                        type="time" 
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveAvailability}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
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
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Flag className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointments?.filter(a => a.priority === 'high').length || 0}
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
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold overflow-hidden">
                      {apt.patient?.imageUrl ? (
                        <img src={apt.patient.imageUrl} alt={apt.patient?.name} className="h-full w-full object-cover" />
                      ) : (
                        apt.patient?.name?.[0]
                      )}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="high-priority-mode" 
                  checked={showHighPriorityOnly}
                  onCheckedChange={setShowHighPriorityOnly}
                />
                <Label htmlFor="high-priority-mode" className="flex items-center gap-1 cursor-pointer">
                  <Filter className="h-3 w-3" /> High Priority Only
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={filteredAppointments.map(a => a._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredAppointments?.map((apt) => (
                    <SortableAppointmentItem 
                      key={apt._id} 
                      apt={apt} 
                      handlePriorityChange={handlePriorityChange} 
                    />
                  ))}
                </SortableContext>
              </DndContext>
              
              {filteredAppointments?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {showHighPriorityOnly ? "No high priority appointments found." : "No appointments found."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}