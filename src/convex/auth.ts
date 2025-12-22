import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";

async function sendVerificationRequest({ identifier: email, token }: { identifier: string, token: string }) {
  console.log(`Sending verification code to ${email}`);
  try {
    const response = await fetch("https://email.vly.ai/send_otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "vlytothemoon2025",
      },
      body: JSON.stringify({
        to: email,
        otp: token,
        appName: "HealthcareCompanion",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send OTP: ${await response.text()}`);
    }
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email. Please try again.");
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      id: "password",
      verify: Email({
        id: "email-verification",
        maxAge: 60 * 15, // 15 minutes
        generateVerificationToken: async () => {
          return Math.floor(100000 + Math.random() * 900000).toString();
        },
        sendVerificationRequest,
      }),
      // Explicitly define password requirements to override defaults and match frontend
      validatePasswordRequirements: (password: string) => {
        if (password.length < 8) {
          return "Password must be at least 8 characters long";
        }
        // Frontend handles complexity checks (uppercase, number, special char)
        // We enforce length here as a baseline security measure
        return;
      },
    }),
  ],
});