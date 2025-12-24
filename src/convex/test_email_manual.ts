"use node";
import { action } from "./_generated/server";

export const send = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.VLY_INTEGRATION_KEY;
    if (!apiKey) {
      return { success: false, error: "VLY_INTEGRATION_KEY not set" };
    }

    console.log("Testing manual email send...");
    
    try {
      const response = await fetch("https://integrations.vly.ai/v1/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
          "X-Vly-Version": "0.1.0",
        },
        body: JSON.stringify({
          to: ["test@example.com"], // Replace with a real email if needed for verification
          from: "Health Companion <noreply@vly.io>",
          subject: "Test Email (Manual Fetch)",
          html: "<p>This is a test email sent via manual fetch.</p>",
          text: "This is a test email sent via manual fetch.",
        }),
      });

      const text = await response.text();
      console.log("Response status:", response.status);
      console.log("Response body:", text);

      if (!response.ok) {
        return { success: false, error: `API Error ${response.status}: ${text}` };
      }

      return { success: true, result: JSON.parse(text) };
    } catch (e: any) {
      console.error("Fetch Error:", e);
      return { success: false, error: e.message, stack: e.stack };
    }
  }
});
