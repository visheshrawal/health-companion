import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const user = useQuery(api.users.currentUser);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <img 
            src="https://harmless-tapir-303.convex.cloud/api/storage/3fe1a561-c673-435a-a446-70cf0fae959d" 
            alt="Health Companion" 
            className="h-16 w-16 object-contain" 
          />
          <h1 className="text-2xl font-bold text-primary">Health Companion</h1>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/auth" />;
  }

  if (user.role === "patient") {
    return <Navigate to="/patient" />;
  }

  if (user.role === "doctor") {
    return <Navigate to="/doctor" />;
  }

  return <Navigate to="/profile" />;
}