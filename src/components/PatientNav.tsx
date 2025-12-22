import { Home, Pill, Calendar, User } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";

export function PatientNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { href: "/patient", icon: Home, label: "Home" },
    { href: "/patient/medications", icon: Pill, label: "Meds" },
    { href: "/patient/appointments", icon: Calendar, label: "Visits" },
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
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="md:flex">
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r bg-card/50 backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              HC
            </div>
            <span className="font-bold text-xl">Health Companion</span>
          </div>
          <nav className="space-y-2">
            <Link to="/patient" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Link to="/patient/medications" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <Pill className="h-5 w-5" />
              Medications
            </Link>
            <Link to="/patient/appointments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <Calendar className="h-5 w-5" />
              Appointments
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors">
              <User className="h-5 w-5" />
              Profile
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
      <PatientNav />
    </div>
  );
}
