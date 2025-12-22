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
import { Loader2, User, Stethoscope, LogOut, CheckCircle2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function Profile() {
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);

  // Step state
  const [step, setStep] = useState(1);

  // Form state
  const [role, setRole] = useState<"patient" | "doctor" | "">("");
  const [name, setName] = useState("");
  
  // Patient Fields
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [conditions, setConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Doctor Fields
  const [specialization, setSpecialization] = useState("");
  const [license, setLicense] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      if (user.role) {
        setRole(user.role as "patient" | "doctor");
        // If role is set but profile not completed, go to step 2
        if (!user.profileCompleted) {
          setStep(2);
        }
      }
      
      // Pre-fill if data exists
      if (user.patientProfile) {
        setDob(user.patientProfile.dateOfBirth);
        setSex(user.patientProfile.sex || "");
        setBloodGroup(user.patientProfile.bloodGroup || "");
        setConditions(user.patientProfile.conditions.join(", "));
        setAllergies(user.patientProfile.allergies.join(", "));
        setEmergencyName(user.patientProfile.emergencyContact.name);
        setEmergencyPhone(user.patientProfile.emergencyContact.phone);
      }
      
      if (user.doctorProfile) {
        setSpecialization(user.doctorProfile.specialization);
        setLicense(user.doctorProfile.licenseNumber || "");
        setAffiliation(user.doctorProfile.affiliation || "");
        setBio(user.doctorProfile.bio);
      }
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !name) return;
    
    setIsLoading(true);
    try {
      await updateProfile({
        name,
        role: role as "patient" | "doctor",
      });
      setStep(2);
    } catch (error) {
      toast.error("Failed to save account details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (role === "patient") {
        await updateProfile({
          profileCompleted: true,
          patientProfile: {
            dateOfBirth: dob,
            sex,
            bloodGroup,
            conditions: conditions.split(",").map(c => c.trim()).filter(Boolean),
            allergies: allergies.split(",").map(c => c.trim()).filter(Boolean),
            emergencyContact: {
              name: emergencyName,
              phone: emergencyPhone,
            },
          }
        });
        navigate("/patient");
      } else {
        await updateProfile({
          profileCompleted: true,
          doctorProfile: {
            specialization,
            licenseNumber: license,
            affiliation,
            bio,
            isVerified: false,
          }
        });
        navigate("/doctor");
      }
      toast.success("Profile completed successfully!");
    } catch (error) {
      toast.error("Failed to complete profile");
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>
            <span className="text-sm text-muted-foreground">Step {step} of 2</span>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 ? "Create Your Account" : role === "patient" ? "Complete Your Health Profile" : "Complete Your Professional Profile"}
          </CardTitle>
          <CardDescription>
            {step === 1 ? "Let's get you set up with the right account type." : "Help us personalize your experience."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
              </div>

              <div className="space-y-2">
                <Label>I am signing up as a:</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`cursor-pointer border rounded-xl p-6 flex flex-col items-center gap-3 transition-all ${role === "patient" ? "border-primary bg-primary/10 ring-2 ring-primary" : "hover:bg-accent"}`}
                    onClick={() => setRole("patient")}
                  >
                    <User className="h-10 w-10 text-primary" />
                    <span className="font-medium text-lg">Patient</span>
                  </div>
                  <div
                    className={`cursor-pointer border rounded-xl p-6 flex flex-col items-center gap-3 transition-all ${role === "doctor" ? "border-primary bg-primary/10 ring-2 ring-primary" : "hover:bg-accent"}`}
                    onClick={() => setRole("doctor")}
                  >
                    <Stethoscope className="h-10 w-10 text-primary" />
                    <span className="font-medium text-lg">Doctor</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !role || !name}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {role === "patient" ? (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Basic Health Demographics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex">Biological Sex</Label>
                        <Select value={sex} onValueChange={setSex}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Select value={bloodGroup} onValueChange={setBloodGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map(bg => (
                              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2 text-primary">Critical Safety Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="conditions">Known Health Conditions (comma separated)</Label>
                      <Textarea id="conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Diabetes, Hypertension, Asthma..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Known Allergies (comma separated)</Label>
                      <Textarea id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Penicillin, Peanuts..." />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2 text-destructive">Emergency Contact (Mandatory for SOS)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyName">Contact Name</Label>
                        <Input id="emergencyName" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">Phone Number</Label>
                        <Input id="emergencyPhone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required placeholder="+1..." />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Professional Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Medical Specialization</Label>
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
                          <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License / Registration No.</Label>
                      <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="MED-12345" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="affiliation">Clinic / Hospital Name</Label>
                      <Input id="affiliation" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="City General Hospital" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio / Introduction</Label>
                      <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Briefly introduce yourself..." className="min-h-[100px]" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Save & Continue to Dashboard
                </Button>
              </div>
              <div className="text-center">
                 <Button type="button" variant="link" className="text-xs text-muted-foreground" onClick={() => navigate(role === "patient" ? "/patient" : "/doctor")}>
                   Skip for now (Profile will be incomplete)
                 </Button>
              </div>
            </form>
          )}
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Your data is protected and used solely for your care.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}