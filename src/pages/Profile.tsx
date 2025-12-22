import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2, User, Stethoscope, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function Profile() {
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [role, setRole] = useState<"patient" | "doctor" | "">("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [conditions, setConditions] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      if (user.role) setRole(user.role as "patient" | "doctor");
      if (user.age) setAge(user.age.toString());
      if (user.conditions) setConditions(user.conditions.join(", "));
      if (user.emergencyContact) {
        setEmergencyName(user.emergencyContact.name);
        setEmergencyPhone(user.emergencyContact.phone);
      }
      if (user.specialization) setSpecialization(user.specialization);
      if (user.bio) setBio(user.bio);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({
        name,
        role: role as "patient" | "doctor",
        age: role === "patient" ? parseInt(age) : undefined,
        conditions: role === "patient" ? conditions.split(",").map(c => c.trim()).filter(Boolean) : undefined,
        emergencyContact: role === "patient" ? { name: emergencyName, phone: emergencyPhone } : undefined,
        specialization: role === "doctor" ? specialization : undefined,
        bio: role === "doctor" ? bio : undefined,
      });
      toast.success("Profile updated successfully");
      if (role === "patient") navigate("/patient");
      else if (role === "doctor") navigate("/doctor");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user === undefined) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
      <Card className="w-full max-w-2xl glass">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>Tell us about yourself to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
            </div>

            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${role === "patient" ? "border-primary bg-primary/10 ring-2 ring-primary" : "hover:bg-accent"}`}
                  onClick={() => setRole("patient")}
                >
                  <User className="h-8 w-8" />
                  <span className="font-medium">Patient</span>
                </div>
                <div
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${role === "doctor" ? "border-primary bg-primary/10 ring-2 ring-primary" : "hover:bg-accent"}`}
                  onClick={() => setRole("doctor")}
                >
                  <Stethoscope className="h-8 w-8" />
                  <span className="font-medium">Doctor</span>
                </div>
              </div>
            </div>

            {role === "patient" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditions">Medical Conditions (comma separated)</Label>
                  <Textarea id="conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Diabetes, Hypertension..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                    <Input id="emergencyName" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <Input id="emergencyPhone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required />
                  </div>
                </div>
              </div>
            )}

            {role === "doctor" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Select value={specialization} onValueChange={setSpecialization}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Practice">General Practice</SelectItem>
                      <SelectItem value="Cardiology">Cardiology</SelectItem>
                      <SelectItem value="Dermatology">Dermatology</SelectItem>
                      <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="Neurology">Neurology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Dr. Smith has 10 years of experience..." />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !role}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}