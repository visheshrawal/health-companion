import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

// We use a manual fetch implementation for email sending to avoid 
// runtime compatibility issues with the Vly SDK in the default Convex runtime.
async function sendVerificationRequest({ identifier: email, token }: { identifier: string, token: string }) {
  console.log(`Sending verification code to ${email}`);
  const apiKey = process.env.VLY_INTEGRATION_KEY;
  
  if (!apiKey) {
    console.error("VLY_INTEGRATION_KEY is not set");
    throw new ConvexError("Service configuration error: Missing email API key");
  }

  // Use the correct endpoint found in the SDK source
  const url = "https://integrations.vly.ai/v1/email/send";

  try {
    console.log(`Attempting to send email via ${url}...`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`,
        "X-Vly-Version": "0.1.0",
      },
      body: JSON.stringify({
        to: [email],
        from: "Health Companion <noreply@vly.io>",
        subject: "Sign in to Health Companion",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2>Sign in to Health Companion</h2>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing: 5px; background: #f4f4f5; padding: 10px; border-radius: 4px; display: inline-block;">${token}</h1>
            <p>This code will expire in 15 minutes.</p>
            <hr />
            <p style="font-size: 12px; color: #666;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `,
        text: `Your verification code for Health Companion is: ${token}`,
      }),
    });

    if (response.ok) {
      console.log(`Successfully sent email via ${url}`);
      return; // Success!
    }

    const errorText = await response.text();
    console.error(`Failed to send via ${url}: ${response.status} ${errorText}`);
    throw new Error(`API Error ${response.status}: ${errorText}`);
  } catch (error) {
    console.error(`Error sending via ${url}:`, error);
    throw new ConvexError(`Failed to send verification email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      id: "password",
      profile(params) {
        return {
          email: params.email as string,
        };
      },
      verify: Email({
        id: "email-verification",
        maxAge: 60 * 15, // 15 minutes
        generateVerificationToken: async () => {
          return Math.floor(100000 + Math.random() * 900000).toString();
        },
        sendVerificationRequest,
      }),
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const email = args.profile.email as string;
      if (!email) throw new ConvexError("Email is required");

      // Check for existing user
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .unique();

      if (existingUser) {
        return existingUser._id;
      }

      // Create new user
      const newUserId = await ctx.db.insert("users", {
        email,
        role: "patient", // Default role
        profileCompleted: false,
        emailVerified: true,
      });

      return newUserId;
    },
  },
});