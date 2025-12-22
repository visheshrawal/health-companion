import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pill } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PatientMedications() {
  const medications = useQuery(api.medications.list);
  const addMedication = useMutation(api.medications.add);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addMedication({
        name: formData.get("name") as string,
        dosage: formData.get("dosage") as string,
        frequency: formData.get("frequency") as string,
        startDate: Date.now(),
      });
      toast.success("Medication added");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to add medication");
    }
  };

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">My Medications</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Medication</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Medication Name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Lisinopril" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input id="dosage" name="dosage" required placeholder="e.g. 10mg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input id="frequency" name="frequency" required placeholder="e.g. Once daily" />
                </div>
                <Button type="submit" className="w-full">Add Medication</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {medications?.map((med) => (
            <Card key={med._id} className="glass hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{med.name}</CardTitle>
                <Pill className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Dosage: <span className="font-medium text-foreground">{med.dosage}</span></p>
                  <p className="text-sm text-muted-foreground">Frequency: <span className="font-medium text-foreground">{med.frequency}</span></p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {med.prescriptionId ? "Prescribed by Doctor" : "Self-added"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {medications?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No medications found. Add one to get started.
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
