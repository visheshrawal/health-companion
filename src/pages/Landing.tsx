import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { 
  ArrowRight, Brain, FileText, Languages, 
  Activity, Clock, Calendar, Siren, MapPin, 
  Users, LayoutDashboard, Workflow, Timer 
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      category: "AI-Powered Health Assistant",
      items: [
        { title: "Symptom Analysis", desc: "Preliminary assessment with Google's Gemini AI", icon: Brain },
        { title: "Consultation Summaries", desc: "AI transforms doctor notes into patient-friendly language", icon: FileText },
        { title: "Medical Translation", desc: "Bridges communication gap between doctors and patients", icon: Languages },
      ]
    },
    {
      category: "Smart Medication Management",
      items: [
        { title: "Digital Prescriptions", desc: "Paperless prescriptions from doctors", icon: FileText },
        { title: "Adherence Tracking", desc: "Supportive streak system (no competitive pressure)", icon: Activity },
        { title: "Dosage Scheduling", desc: "Morning/Afternoon/Night mapping with food instructions", icon: Clock },
      ]
    },
    {
      category: "Complete Healthcare Platform",
      items: [
        { title: "Priority Scheduling", desc: "Dynamic appointment system with doctor control", icon: Calendar },
        { title: "Emergency SOS", desc: "One-tap alerts with location sharing to contacts", icon: Siren },
        { title: "Nearby Hospital Finder", desc: "Integrated Google Maps for emergencies", icon: MapPin },
        { title: "Health Teams", desc: "Private support groups for families", icon: Users },
      ]
    },
    {
      category: "Doctor Empowerment",
      items: [
        { title: "Smart Dashboard", desc: "Priority-based patient management", icon: LayoutDashboard },
        { title: "Digital Workflow", desc: "Paperless prescriptions and consultation notes", icon: Workflow },
        { title: "Time Savings", desc: "Reduces administrative burden by 2-3 hours weekly", icon: Timer },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <img src="https://harmless-tapir-303.convex.cloud/api/storage/3fe1a561-c673-435a-a446-70cf0fae959d" alt="Health Companion" className="h-8 w-8 object-contain" />
          Health Companion
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-6xl space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-8 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent pb-2">
              Healthcare Simplified.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your medications, book appointments, and connect with your doctor seamlessly. 
              A secure platform for modern healthcare.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8 h-14 rounded-full" onClick={() => navigate("/auth")}>
                Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-16 pt-12 text-left">
            {features.map((category, idx) => (
              <div key={idx} className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight text-center md:text-left border-b pb-2">{category.category}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {category.items.map((item, i) => (
                    <div key={i} className="glass p-6 rounded-2xl space-y-3 hover:scale-105 transition-transform duration-300">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-muted-foreground text-sm">
        <div className="mt-20 pt-8 border-t text-center text-muted-foreground">
          <p>&copy; 2025 Health Companion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}