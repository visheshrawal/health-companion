import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX, Lock, Check, AlertCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  
  const [flow, setFlow] = useState<"signIn" | "signUp" | "verify" | "forgotPassword" | "resetPassword">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to parse errors
  const parseError = (err: any) => {
    let msg = "An error occurred";
    if (typeof err === "string") {
      msg = err;
    } else if (err instanceof Error) {
      msg = err.message;
    } else if (err.message) {
      msg = err.message;
    } else if (err.toString) {
      msg = err.toString();
    }

    try {
      if (msg.startsWith('{') || msg.includes('{"')) {
         const jsonStart = msg.indexOf('{');
         const jsonEnd = msg.lastIndexOf('}') + 1;
         if (jsonStart >= 0 && jsonEnd > jsonStart) {
           const jsonStr = msg.substring(jsonStart, jsonEnd);
           const parsed = JSON.parse(jsonStr);
           return parsed.message || msg;
         }
      }
    } catch {
      // ignore
    }
    return msg;
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/dashboard";
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number";
    // "one unique letter" interpreted as special char or just ensuring complexity
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character";
    return null;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signIn("password", { email: email.trim(), password, flow: "signIn" });
      // Redirect handled by useEffect
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signIn("password", { email: email.trim(), password, flow: "signUp" });
      setFlow("verify");
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      console.error("Sign up error:", err);
      const msg = parseError(err);

      // Check for specific error conditions
      if (msg.includes("already in use") || msg.includes("Constraint violation") || msg.includes("Unique constraint") || msg.includes("User already exists")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("password", { email: email.trim(), password, flow: "signUp" });
      toast.success("Verification code resent");
    } catch (err) {
      console.error("Resend error:", err);
      const msg = parseError(err);
      if (msg.includes("already in use")) {
         toast.error("Account already exists. Please try verifying with the existing code or sign in.");
      } else {
         toast.error("Failed to resend code: " + msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // For verification during signup
      await signIn("password", { email: email.trim(), password, code: otp, flow: "signUp" });
      // Redirect handled by useEffect
    } catch (err) {
      console.error(err);
      setError(parseError(err));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signIn("password", { email: email.trim(), flow: "reset" }); // Trigger reset flow
      setFlow("resetPassword");
      toast.success("Password reset code sent to your email");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset code. Please check your email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signIn("password", { email: email.trim(), code: otp, newPassword: password, flow: "reset" });
      toast.success("Password reset successfully. Please sign in.");
      setFlow("signIn");
      setPassword("");
      setConfirmPassword("");
      setOtp("");
    } catch (err) {
      console.error(err);
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Guest login is currently disabled
      // await signIn("anonymous");
      setError("Guest access is currently disabled");
    } catch (error) {
      console.error("Guest login error:", error);
      setError("Failed to sign in as guest");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex flex-col justify-center p-8 md:p-16 bg-background">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary mb-8">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/3fe1a561-c673-435a-a446-70cf0fae959d" alt="Health Companion" className="h-8 w-8 object-contain" />
            Health Companion
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="pl-9" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button variant="link" className="p-0 h-auto text-xs" type="button" onClick={() => setFlow("forgotPassword")}>
                Forgot password?
              </Button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                className="pl-9" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
          {error && <div className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </div>
      </div>
      <div className="flex flex-col justify-center p-8 md:p-16 bg-muted">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary mb-8">
            <img src="https://harmless-tapir-303.convex.cloud/api/storage/3fe1a561-c673-435a-a446-70cf0fae959d" alt="Health Companion" className="h-8 w-8 object-contain" />
            Health Companion
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="pl-9" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button variant="link" className="p-0 h-auto text-xs" type="button" onClick={() => setFlow("forgotPassword")}>
                Forgot password?
              </Button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                className="pl-9" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
          {error && <div className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}