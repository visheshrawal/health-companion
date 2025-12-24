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
    
    // Only test the correct endpoint
    const url = "https://integrations.vly.ai/v1/email/send";

    console.log(`Trying URL: ${url}`);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
          "X-Vly-Version": "0.1.0",
        },
        body: JSON.stringify({
          to: ["test@example.com"],
          from: "Health Companion <noreply@vly.io>",
          subject: `Test Email Manual`,
          html: "<p>This is a test email.</p>",
          text: "This is a test email.",
        }),
      });

      const text = await response.text();
      console.log(`Response status for ${url}:`, response.status);
      
      if (response.ok) {
        console.log("SUCCESS with URL:", url);
        return { success: true, url, result: JSON.parse(text) };
      } else {
        console.log(`Failed with ${url}: ${text}`);
        return { success: false, error: `Failed: ${response.status} ${text}` };
      }
    } catch (e: any) {
      console.error(`Error with ${url}:`, e.message);
      return { success: false, error: e.message };
    }
  }
});