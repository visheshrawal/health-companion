import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2, User, Stethoscope, LogOut, CheckCircle2, Edit2, Upload, FileText, Trash2, Camera } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Id } from "@/convex/_generated/dataModel";
import { PatientLayout } from "@/components/PatientNav";
import { ImageCropper } from "@/components/ImageCropper";
import { Navigate } from "react-router";

export default function Profile() {
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const medicalRecords = useQuery(api.medicalRecords.list);
  const addMedicalRecord = useMutation(api.medicalRecords.add);
  const removeMedicalRecord = useMutation(api.medicalRecords.remove);
  
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordInputRef = useRef<HTMLInputElement>(null);

  // Image Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

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
          setIsEditing(true); // Force edit mode for incomplete profile
        } else {
          // Profile completed, default to view mode
          // Only set isEditing to true if we explicitly want to edit, otherwise false
          // But we need to populate the fields
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

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImageSrc(reader.result?.toString() || null);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
      // Reset input so same file can be selected again if needed
      e.target.value = "";
    }
  };

  const handleCroppedImageUpload = async (blob: Blob) => {
    try {
      setIsLoading(true);
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const { storageId } = await result.json();
      
      await updateProfile({ image: storageId });
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error("Failed to upload photo");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      
      await addMedicalRecord({
        title: file.name,
        storageId: storageId as Id<"_storage">,
        format: file.type,
      });
      toast.success("Medical record uploaded");
    } catch (error) {
      toast.error("Failed to upload record");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
      toast.success("Profile updated successfully!");
      setIsEditing(false);
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

  if (user === null) {
    return <Navigate to="/auth" />;
  }

  // Read-Only View
  if (user?.profileCompleted && !isEditing) {
    const content = (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" /> Update Details
              </Button>
              <Button variant="destructive" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>

          <Card className="glass overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20" />
            <CardContent className="relative pt-0">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="-mt-16 relative group">
                  <div className="h-32 w-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-xl">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <div 
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={onFileSelect} 
                  />
                </div>
                
                <div className="mt-4 md:mt-0 flex-1 space-y-1">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground capitalize">{user.role}</p>
                  {user.role === "doctor" && (
                    <p className="text-sm text-primary font-medium">{user.doctorProfile?.specialization}</p>
                  )}
                </div>
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-8">
                {user.role === "patient" ? (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date of Birth</span>
                          <p className="font-medium">{user.patientProfile?.dateOfBirth}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sex</span>
                          <p className="font-medium capitalize">{user.patientProfile?.sex}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Blood Group</span>
                          <p className="font-medium">{user.patientProfile?.bloodGroup}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Medical Information</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Conditions</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.patientProfile?.conditions.map((c, i) => (
                              <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded-md">{c}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Allergies</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.patientProfile?.allergies.map((c, i) => (
                              <span key={i} className="bg-destructive/10 text-destructive px-2 py-1 rounded-md">{c}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 col-span-2">
                    <h3 className="font-semibold text-lg border-b pb-2">Professional Details</h3>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">License Number</span>
                        <p className="font-medium">{user.doctorProfile?.licenseNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Affiliation</span>
                        <p className="font-medium">{user.doctorProfile?.affiliation}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Bio</span>
                        <p className="mt-1">{user.doctorProfile?.bio}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medical Records Section */}
          {user.role === "patient" && (
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Medical Records</CardTitle>
                  <CardDescription>Upload and manage your medical history documents.</CardDescription>
                </div>
                <Button onClick={() => recordInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Record
                </Button>
                <input 
                  type="file" 
                  ref={recordInputRef} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" 
                  onChange={handleRecordUpload} 
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {medicalRecords?.map((record) => (
                    <div key={record._id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px] md:max-w-md">{record.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.uploadedAt).toLocaleDateString()} • {record.format.split('/')[1] || 'file'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={record.url || "#"} target="_blank" rel="noopener noreferrer">View</a>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeMedicalRecord({ id: record._id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {medicalRecords?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                      No records uploaded yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <ImageCropper 
            open={cropModalOpen} 
            onOpenChange={setCropModalOpen} 
            imageSrc={selectedImageSrc} 
            onCropComplete={handleCroppedImageUpload} 
          />
        </div>
      </div>
    );

    if (user.role === "patient") {
      return <PatientLayout>{content}</PatientLayout>;
    }
    return content;
  }

  // Edit/Onboarding View
  const editContent = (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 relative ${user.role === "patient" ? "bg-transparent min-h-full" : ""}`}>
      {user.role !== "patient" && (
        <div className="absolute top-4 right-4">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      )}
      
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

  if (user.role === "patient") {
    return <PatientLayout>{editContent}</PatientLayout>;
  }
  return editContent;
}