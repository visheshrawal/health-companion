import { Home, Pill, Calendar, User, Stethoscope, FileText, Compass, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { SymptomChecker } from "@/components/SymptomChecker";
import { Button } from "@/components/ui/button";
import { useDemoMode } from "@/lib/demo";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function PatientNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { href: "/patient", icon: Home, label: "Home" },
    { href: "/patient/medications", icon: Pill, label: "Meds" },
    { href: "/patient/hospitals", icon: MapPin, label: "Nearby" },
    { href: "/patient/discover", icon: Compass, label: "Discover" },
    { href: "/patient/appointments", icon: Calendar, label: "Visits" },
    { href: "/patient/history", icon: FileText, label: "History" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border p-2 z-50 md:hidden">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/patient" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
        <SymptomChecker>
          <button className="flex flex-col items-center p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <Stethoscope className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Check</span>
          </button>
        </SymptomChecker>
      </div>
    </div>
  );
}

export function PatientLayout({ children }: { children: React.ReactNode }) {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {isDemoMode && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-center text-sm font-medium sticky top-0 z-50 md:hidden">
          🟡 Demo Mode Active
        </div>
      )}
      <div className="md:flex">
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r bg-card/50 backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-8">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/3fe1a561-c673-435a-a446-70cf0fae959d" alt="Health Companion" className="h-8 w-8 object-contain" />
            <span className="font-bold text-xl">Health Companion</span>
          </div>
          
          <div className="mb-6 px-4 py-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <Label htmlFor="demo-mode-sidebar" className="text-sm font-medium cursor-pointer">Demo Mode</Label>
              <Switch 
                id="demo-mode-sidebar" 
                checked={isDemoMode}
                onCheckedChange={toggleDemoMode}
                className="scale-75"
              />
            </div>
            {isDemoMode && <p className="text-[10px] text-muted-foreground mt-2">Showing simulated data</p>}
          </div>

          <nav className="space-y-2 flex-1">
            <Link to="/patient" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Link to="/patient/medications" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <Pill className="h-5 w-5" />
              Medications
            </Link>
            <Link to="/patient/hospitals" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <MapPin className="h-5 w-5" />
              Nearby Hospitals
            </Link>
            <Link to="/patient/discover" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <Compass className="h-5 w-5" />
              Discover
            </Link>
            <Link to="/patient/appointments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <Calendar className="h-5 w-5" />
              Appointments
            </Link>
            <Link to="/patient/history" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <FileText className="h-5 w-5" />
              History
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <User className="h-5 w-5" />
              Profile
            </Link>
          </nav>
          
          <div className="mt-auto pt-4 border-t">
            <SymptomChecker>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Stethoscope className="h-4 w-4" />
                Symptom Checker
              </Button>
            </SymptomChecker>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
      <PatientNav />
    </div>
  );
}