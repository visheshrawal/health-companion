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
      await signIn("password", { email: email.trim(), code: otp, flow: "signUp" });
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary cursor-pointer" onClick={() => navigate("/")}>
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
              HC
            </div>
            HealthcareCompanion
          </div>
        </div>

        <Card className="border-primary/10 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">
              {flow === "signIn" && "Welcome Back"}
              {flow === "signUp" && "Create Account"}
              {flow === "verify" && "Verify Email"}
              {flow === "forgotPassword" && "Reset Password"}
              {flow === "resetPassword" && "Set New Password"}
            </CardTitle>
            <CardDescription>
              {flow === "signIn" && "Enter your credentials to access your account"}
              {flow === "signUp" && "Enter your details to get started"}
              {flow === "verify" && `Enter the code sent to ${email}`}
              {flow === "forgotPassword" && "Enter your email to receive a reset code"}
              {flow === "resetPassword" && "Create a new password for your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flow === "signIn" && (
              <form onSubmit={handleSignIn} className="space-y-4">
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
              </form>
            )}

            {flow === "signUp" && (
              <form onSubmit={handleSignUp} className="space-y-4">
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
                  <Label htmlFor="password">Password</Label>
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
                  <p className="text-xs text-muted-foreground">
                    Min 8 chars, 1 uppercase, 1 number, 1 special char
                  </p>
                </div>
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
                {error && <div className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
                <div className="text-center text-sm text-muted-foreground mt-2">
                  Already have an account?{" "}
                  <Button variant="link" className="p-0 h-auto font-semibold text-primary" onClick={() => setFlow("signIn")}>
                    Sign In
                  </Button>
                </div>
              </form>
            )}

            {flow === "verify" && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex justify-center py-4">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && <div className="text-sm text-destructive flex items-center gap-2 justify-center"><AlertCircle className="h-4 w-4" /> {error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Email"}
                </Button>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" className="w-full" onClick={handleResendCode} disabled={isLoading}>
                    Resend Code
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setFlow("signUp")}>
                    Back to Sign Up
                  </Button>
                </div>
              </form>
            )}

            {flow === "forgotPassword" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
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
                {error && <div className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Code"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setFlow("signIn")}>
                  Back to Sign In
                </Button>
              </form>
            )}

            {flow === "resetPassword" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmNewPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                {error && <div className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            {flow === "signIn" ? (
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setFlow("signUp")}>
                  Sign Up
                </Button>
              </p>
            ) : null}
          </CardFooter>
        </Card>
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