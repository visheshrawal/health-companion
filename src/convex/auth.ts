import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

// Enhanced email sending with better error handling and fallback
async function sendVerificationRequest({ identifier: email, token }: { identifier: string, token: string }) {
  console.log(`[AUTH] Sending verification code to ${email}`);
  const apiKey = process.env.VLY_INTEGRATION_KEY;
  
  if (!apiKey) {
    console.error("[AUTH] VLY_INTEGRATION_KEY is not set");
    // In development, log the code instead of failing
    if (process.env.CONVEX_CLOUD_URL?.includes("localhost") || !process.env.CONVEX_CLOUD_URL) {
      console.log(`[AUTH] DEVELOPMENT MODE - Verification code for ${email}: ${token}`);
      return; // Allow signup to proceed in dev mode
    }
    throw new ConvexError("Service configuration error: Missing email API key");
  }

  try {
    console.log(`[AUTH] Attempting to send email using VLY SDK...`);
    
    // Import the SDK dynamically in Node runtime
    const { createVlyIntegrations } = await import("@vly-ai/integrations");
    const vly = createVlyIntegrations({
      deploymentToken: apiKey,
      debug: false,
    });

    const emailResult = await vly.email.send({
      to: email,
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
    });

    console.log(`[AUTH] Email send result:`, JSON.stringify(emailResult, null, 2));

    if (emailResult.success) {
      console.log(`[AUTH] ✅ Successfully sent email to ${email}`);
      return;
    }

    // Email sending failed - check if we're in development mode
    console.error(`[AUTH] ❌ Email sending failed:`, emailResult.error || emailResult);
    
    // In development mode, log the code and allow signup to proceed
    if (process.env.CONVEX_CLOUD_URL?.includes("localhost") || !process.env.CONVEX_CLOUD_URL) {
      console.log(`[AUTH] DEVELOPMENT MODE - Verification code for ${email}: ${token}`);
      console.log(`[AUTH] ⚠️ Email service unavailable, but allowing signup to proceed`);
      console.log(`[AUTH] Note: Please ensure VLY_INTEGRATION_KEY has email service access enabled at vly.ai`);
      return; // Allow signup to proceed in dev mode
    }
    
    // In production, throw an error
    throw new ConvexError(`Failed to send verification email: ${emailResult.error || "Email service unavailable"}`);
  } catch (error) {
    console.error(`[AUTH] Exception while sending email:`, error);
    
    // In development mode, log the code and allow signup to proceed
    if (process.env.CONVEX_CLOUD_URL?.includes("localhost") || !process.env.CONVEX_CLOUD_URL) {
      console.log(`[AUTH] DEVELOPMENT MODE - Verification code for ${email}: ${token}`);
      console.log(`[AUTH] ⚠️ Email service error, but allowing signup to proceed`);
      console.log(`[AUTH] Error details:`, error instanceof Error ? error.message : String(error));
      return; // Allow signup to proceed in dev mode
    }
    
    // In production, throw an error
    throw new ConvexError(`Failed to send verification email: ${error instanceof Error ? error.message : "Email sending failed"}`);
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
        role: "patient",
        profileCompleted: false,
        emailVerified: true,
      });

      return newUserId;
    },
  },
});