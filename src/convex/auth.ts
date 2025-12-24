import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

async function sendVerificationRequest({ identifier: email, token }: { identifier: string, token: string }) {
  console.log(`Sending verification code to ${email}`);
  try {
    const apiKey = process.env.VLY_INTEGRATION_KEY;
    if (!apiKey) {
      console.error("VLY_INTEGRATION_KEY is not set in environment variables");
      throw new ConvexError("Server configuration error: Missing email API key");
    }

    // Use Vly Integrations API directly to avoid runtime issues with the package in V8
    const response = await fetch("https://integrations.vly.ai/v1/email/send", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vly Email API Error: ${response.status} ${errorText}`);
      throw new ConvexError(`Failed to send OTP: ${errorText}`);
    }
  } catch (error) {
    console.error("Failed to send verification email:", error);
    if (error instanceof ConvexError) throw error;
    throw new ConvexError("Failed to send verification email. Please try again.");
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
      // Explicitly define password requirements to override defaults and match frontend
      validatePasswordRequirements: (password: string) => {
        if (!password) return; // Skip validation if password is not provided (e.g. during verification)
        if (password.length < 8) {
          return "Password must be at least 8 characters long";
        }
        // Frontend handles complexity checks (uppercase, number, special char)
        // We enforce length here as a baseline security measure
        return;
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      console.log("createOrUpdateUser called with args:", JSON.stringify(args, null, 2));
      
      if (args.existingUserId) {
        console.log("Updating existing user:", args.existingUserId);
        return args.existingUserId;
      }

      console.log("Creating new user for profile:", args.profile);

      try {
        // Create new user with default role
        // Ensure email is undefined if null/empty to match v.optional(v.string())
        const email = args.profile.email as string | undefined;

        if (!email) {
          throw new ConvexError("Email is required for user creation");
        }

        // Check if user with this email already exists to prevent duplicates
        const existingUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();
        
        if (existingUser) {
          console.log("Found existing user by email, linking:", existingUser._id);
          return existingUser._id;
        }

        const newUserId = await ctx.db.insert("users", {
          email: email,
          role: "patient", // Default role
          profileCompleted: false,
          emailVerified: true,
          emailVerificationTime: Date.now(),
        });

        console.log("Successfully created new user:", newUserId);
        return newUserId;
      } catch (error) {
        console.error("Failed to create user in database:", error);
        // Throwing a new error here might mask the original one in client, 
        // but logging it on server is crucial.
        if (error instanceof ConvexError) throw error;
        throw new ConvexError(`Failed to create user profile: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  },
});