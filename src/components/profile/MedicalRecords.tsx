import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Trash2 } from "lucide-react";

interface MedicalRecordsProps {
  medicalRecords: any[];
  recordInputRef: any;
  handleRecordUpload: any;
  removeMedicalRecord: any;
}

export function MedicalRecords({ medicalRecords, recordInputRef, handleRecordUpload, removeMedicalRecord }: MedicalRecordsProps) {
  return (
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
  );
}
