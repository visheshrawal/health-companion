import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Stethoscope, LogOut, CheckCircle2 } from "lucide-react";

interface ProfileEditProps {
  user: any;
  step: number;
  setStep: (step: number) => void;
  role: string;
  setRole: (role: any) => void;
  name: string;
  setName: (name: string) => void;
  isLoading: boolean;
  handleStep1Submit: (e: React.FormEvent) => void;
  handleStep2Submit: (e: React.FormEvent) => void;
  handleSignOut: () => void;
  // Patient Fields
  dob: string; setDob: (v: string) => void;
  sex: string; setSex: (v: string) => void;
  bloodGroup: string; setBloodGroup: (v: string) => void;
  conditions: string; setConditions: (v: string) => void;
  allergies: string; setAllergies: (v: string) => void;
  emergencyName: string; setEmergencyName: (v: string) => void;
  emergencyPhone: string; setEmergencyPhone: (v: string) => void;
  emergencyEmail: string; setEmergencyEmail: (v: string) => void;
  // Doctor Fields
  specialization: string; setSpecialization: (v: string) => void;
  license: string; setLicense: (v: string) => void;
  affiliation: string; setAffiliation: (v: string) => void;
  bio: string; setBio: (v: string) => void;
}

export function ProfileEdit({
  user, step, setStep, role, setRole, name, setName, isLoading,
  handleStep1Submit, handleStep2Submit, handleSignOut,
  dob, setDob, sex, setSex, bloodGroup, setBloodGroup, conditions, setConditions,
  allergies, setAllergies, emergencyName, setEmergencyName, emergencyPhone, setEmergencyPhone, emergencyEmail, setEmergencyEmail,
  specialization, setSpecialization, license, setLicense, affiliation, setAffiliation, bio, setBio
}: ProfileEditProps) {
  
  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {user.role !== "patient" && (
        <div className="absolute top-4 right-4 z-10">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      )}
      
      <Card className="w-full glass">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>
            <span className="text-sm text-muted-foreground">Step {step} of 2</span>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 ? "Account Details" : role === "patient" ? "Health Profile" : "Professional Profile"}
          </CardTitle>
          <CardDescription>
            {step === 1 ? "Update your basic account information." : "Update your detailed profile information."}
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
                <Label>I am a:</Label>
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
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="emergencyEmail">Email Address</Label>
                        <Input id="emergencyEmail" type="email" value={emergencyEmail} onChange={(e) => setEmergencyEmail(e.target.value)} required placeholder="emergency@example.com" />
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
                  Save & View Profile
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}