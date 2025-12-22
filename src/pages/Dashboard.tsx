import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const user = useQuery(api.users.currentUser);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.role) {
    return <Navigate to="/profile" replace />;
  }

  if (user.role === "patient") {
    return <Navigate to="/patient" replace />;
  }

  if (user.role === "doctor") {
    return <Navigate to="/doctor" replace />;
  }

  return <Navigate to="/profile" replace />;
}
