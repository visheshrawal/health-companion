import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const appointment = useQuery(api.appointments.get, { appointmentId: id as Id<"appointments"> });
  const createPrescription = useMutation(api.prescriptions.create);
  const navigate = useNavigate();

  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<Array<{ name: string; dosage: string; frequency: string }>>([
    { name: "", dosage: "", frequency: "" }
  ]);

  const handleAddMed = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "" }]);
  };

  const handleRemoveMed = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: string, value: string) => {
    const newMeds = [...medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedications(newMeds);
  };

  const handleSubmit = async () => {
    if (!appointment) return;
    
    try {
      // Filter out empty meds
      const validMeds = medications.filter(m => m.name && m.dosage);
      
      await createPrescription({
        patientId: appointment.patientId,
        appointmentId: appointment._id,
        notes,
        medications: validMeds.map(m => ({
          ...m,
          startDate: Date.now(),
        })),
      });
      
      toast.success("Prescription created successfully");
      navigate("/doctor");
    } catch (error) {
      toast.error("Failed to create prescription");
      console.error(error);
    }
  };

  if (!appointment) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/doctor")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium">{appointment.patient?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Age</Label>
                  <p className="font-medium">{appointment.patient?.age || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Conditions</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {appointment.patient?.conditions?.map((c, i) => (
                      <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                        {c}
                      </span>
                    )) || "None listed"}
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Appointment Notes</Label>
                  <p className="mt-1">{appointment.notes || "No notes provided."}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Prescription & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Doctor's Notes</Label>
                  <Textarea 
                    placeholder="Clinical observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Prescribed Medications</Label>
                    <Button size="sm" variant="outline" onClick={handleAddMed}>
                      <Plus className="h-4 w-4 mr-1" /> Add Med
                    </Button>
                  </div>
                  
                  {medications.map((med, index) => (
                    <div key={index} className="space-y-3 p-3 border rounded-lg bg-card/30">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Medication {index + 1}</span>
                        {medications.length > 1 && (
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleRemoveMed(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Input 
                        placeholder="Medication Name" 
                        value={med.name}
                        onChange={(e) => handleMedChange(index, "name", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Dosage (e.g. 10mg)" 
                          value={med.dosage}
                          onChange={(e) => handleMedChange(index, "dosage", e.target.value)}
                        />
                        <Input 
                          placeholder="Frequency" 
                          value={med.frequency}
                          onChange={(e) => handleMedChange(index, "frequency", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full" onClick={handleSubmit} disabled={appointment.status === 'completed'}>
                  <Save className="mr-2 h-4 w-4" /> 
                  {appointment.status === 'completed' ? 'Prescription Sent' : 'Issue Prescription'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
