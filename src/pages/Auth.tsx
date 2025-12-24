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
      console.error("Sign in error:", err);
      const msg = parseError(err);
      setError(msg || "Invalid email or password");
    } finally {
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
      if (
        msg.includes("already in use") || 
        msg.includes("Constraint violation") || 
        msg.includes("Unique constraint") || 
        msg.includes("User already exists") || 
        (msg.includes("Account") && msg.includes("already exists"))
      ) {
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
      if (
        msg.includes("already in use") || 
        (msg.includes("Account") && msg.includes("already exists"))
      ) {
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
      console.error("Verification error:", err);
      setError(parseError(err));
    } finally {
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch (error) {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google");
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
          
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {flow === "signIn" && "Welcome back"}
              {flow === "signUp" && "Create an account"}
              {flow === "verify" && "Verify your email"}
              {flow === "forgotPassword" && "Reset password"}
              {flow === "resetPassword" && "Set new password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {flow === "signIn" && "Enter your credentials to access your account"}
              {flow === "signUp" && "Enter your details to get started"}
              {flow === "verify" && "Enter the code sent to your email"}
              {flow === "forgotPassword" && "Enter your email to receive a reset code"}
              {flow === "resetPassword" && "Enter the code and your new password"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (flow === "signIn") handleSignIn(e);
            else if (flow === "signUp") handleSignUp(e);
            else if (flow === "verify") handleVerify(e);
            else if (flow === "forgotPassword") handleForgotPassword(e);
            else if (flow === "resetPassword") handleResetPassword(e);
          }}>
            {/* Email Input - Hidden during verify/resetPassword if we want to keep it clean, but usually good to show what email is being used. 
                However, for resetPassword flow, we need email. For verify, we need email. 
                Let's keep it visible but disabled for verify/resetPassword to avoid confusion. */}
            {(flow === "signIn" || flow === "signUp" || flow === "forgotPassword") && (
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
            )}

            {/* OTP Input */}
            {(flow === "verify" || flow === "resetPassword") && (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Check your email for the 6-digit code
                </p>
              </div>
            )}

            {/* Password Input */}
            {(flow === "signIn" || flow === "signUp" || flow === "resetPassword") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{flow === "resetPassword" ? "New Password" : "Password"}</Label>
                  {flow === "signIn" && (
                    <Button variant="link" className="p-0 h-auto text-xs" type="button" onClick={() => setFlow("forgotPassword")}>
                      Forgot password?
                    </Button>
                  )}
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
            )}

            {/* Confirm Password Input */}
            {(flow === "signUp" || flow === "resetPassword") && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    className="pl-9" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
            )}

            {error && <div className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                flow === "signIn" ? "Sign In" : 
                flow === "signUp" ? "Sign Up" : 
                flow === "verify" ? "Verify Email" : 
                flow === "forgotPassword" ? "Send Reset Code" : 
                "Reset Password"
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm">
            {flow === "signIn" ? (
              <>
                Don't have an account?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setFlow("signUp")}>
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => {
                  setFlow("signIn");
                  setError(null);
                }}>
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="hidden md:flex flex-col justify-center p-8 md:p-16 bg-muted">
        <div className="w-full max-w-md mx-auto space-y-6 text-center">
          <img src="https://harmless-tapir-303.convex.cloud/api/storage/3fe1a561-c673-435a-a446-70cf0fae959d" alt="Health Companion" className="h-32 w-32 mx-auto object-contain mb-4" />
          <h2 className="text-3xl font-bold tracking-tight">Your Health, Simplified</h2>
          <p className="text-muted-foreground text-lg">
            Manage appointments, track medications, and consult with doctors all in one secure platform.
          </p>
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