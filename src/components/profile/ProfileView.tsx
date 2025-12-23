import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Edit2, Trash2, LogOut, Camera } from "lucide-react";
import { PatientLayout } from "@/components/PatientNav";

interface ProfileViewProps {
  user: any;
  setIsEditing: (val: boolean) => void;
  handleResetData: () => void;
  handleSignOut: () => void;
  fileInputRef: any;
  onFileSelect: any;
  medicalRecordsSection: React.ReactNode;
}

export function ProfileView({ 
  user, 
  setIsEditing, 
  handleResetData, 
  handleSignOut, 
  fileInputRef, 
  onFileSelect,
  medicalRecordsSection 
}: ProfileViewProps) {
  const content = (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" /> Update Details
            </Button>
            <Button variant="destructive" onClick={handleResetData} className="bg-red-700 hover:bg-red-800">
              <Trash2 className="mr-2 h-4 w-4" /> Reset Data
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
                          {user.patientProfile?.conditions.map((c: string, i: number) => (
                            <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded-md">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Allergies</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {user.patientProfile?.allergies.map((c: string, i: number) => (
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

        {medicalRecordsSection}
      </div>
    </div>
  );

  if (user.role === "patient") {
    return <PatientLayout>{content}</PatientLayout>;
  }
  return content;
}
