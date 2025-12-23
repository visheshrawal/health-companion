import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Id } from "@/convex/_generated/dataModel";
import { ImageCropper } from "@/components/ImageCropper";
import { Navigate } from "react-router";
import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileEdit } from "@/components/profile/ProfileEdit";
import { MedicalRecords } from "@/components/profile/MedicalRecords";
import { Achievements } from "@/components/profile/Achievements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, Settings, Trophy } from "lucide-react";
import { PatientLayout } from "@/components/PatientNav";

export default function Profile() {
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const medicalRecords = useQuery(api.medicalRecords.list);
  const addMedicalRecord = useMutation(api.medicalRecords.add);
  const removeMedicalRecord = useMutation(api.medicalRecords.remove);
  const resetData = useMutation(api.cleanup.resetAccountData);
  
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
  const [emergencyEmail, setEmergencyEmail] = useState("");

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
        setEmergencyEmail(user.patientProfile.emergencyContact.email || "");
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

  const handleResetData = async () => {
    if (confirm("Are you sure you want to delete all your medical data (appointments, medications, records)? This cannot be undone.")) {
      try {
        await resetData();
        toast.success("All medical data has been reset.");
      } catch (error) {
        toast.error("Failed to reset data.");
      }
    }
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
              email: emergencyEmail,
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
      <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="view" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Records</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-6">
            <ProfileView 
              user={user} 
              setIsEditing={setIsEditing}
              handleResetData={handleResetData}
              handleSignOut={handleSignOut}
              fileInputRef={fileInputRef}
              onFileSelect={onFileSelect}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <MedicalRecords 
              medicalRecords={medicalRecords || []}
              recordInputRef={recordInputRef}
              handleRecordUpload={handleRecordUpload}
              removeMedicalRecord={removeMedicalRecord}
            />
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-6">
            <Achievements />
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <ProfileEdit 
              user={user}
              step={step}
              setStep={setStep}
              role={role}
              setRole={setRole}
              name={name}
              setName={setName}
              isLoading={isLoading}
              handleStep1Submit={handleStep1Submit}
              handleStep2Submit={handleStep2Submit}
              handleSignOut={handleSignOut}
              dob={dob} setDob={setDob}
              sex={sex} setSex={setSex}
              bloodGroup={bloodGroup} setBloodGroup={setBloodGroup}
              conditions={conditions} setConditions={setConditions}
              allergies={allergies} setAllergies={setAllergies}
              emergencyName={emergencyName} setEmergencyName={setEmergencyName}
              emergencyPhone={emergencyPhone} setEmergencyPhone={setEmergencyPhone}
              emergencyEmail={emergencyEmail} setEmergencyEmail={setEmergencyEmail}
              specialization={specialization} setSpecialization={setSpecialization}
              license={license} setLicense={setLicense}
              affiliation={affiliation} setAffiliation={setAffiliation}
              bio={bio} setBio={setBio}
              fileInputRef={fileInputRef}
              onFileSelect={onFileSelect}
            />
          </TabsContent>
        </Tabs>
        
        <ImageCropper
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCroppedImageUpload}
        />
      </div>
    );

    if (user.role === "patient") {
      return <PatientLayout>{content}</PatientLayout>;
    }
    return <div className="min-h-screen bg-background pb-20 md:pb-0">{content}</div>;
  }

  // Edit/Onboarding View
  const editContent = (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <ProfileEdit 
        user={user}
        step={step}
        setStep={setStep}
        role={role}
        setRole={setRole}
        name={name}
        setName={setName}
        isLoading={isLoading}
        handleStep1Submit={handleStep1Submit}
        handleStep2Submit={handleStep2Submit}
        handleSignOut={handleSignOut}
        dob={dob} setDob={setDob}
        sex={sex} setSex={setSex}
        bloodGroup={bloodGroup} setBloodGroup={setBloodGroup}
        conditions={conditions} setConditions={setConditions}
        allergies={allergies} setAllergies={setAllergies}
        emergencyName={emergencyName} setEmergencyName={setEmergencyName}
        emergencyPhone={emergencyPhone} setEmergencyPhone={setEmergencyPhone}
        emergencyEmail={emergencyEmail} setEmergencyEmail={setEmergencyEmail}
        specialization={specialization} setSpecialization={setSpecialization}
        license={license} setLicense={setLicense}
        affiliation={affiliation} setAffiliation={setAffiliation}
        bio={bio} setBio={setBio}
        fileInputRef={fileInputRef}
        onFileSelect={onFileSelect}
      />
      <ImageCropper
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCroppedImageUpload}
      />
    </div>
  );

  if (user.role === "patient") {
    return <PatientLayout>{editContent}</PatientLayout>;
  }
  return <div className="min-h-screen bg-background">{editContent}</div>;
}