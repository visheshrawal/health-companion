"use node";
import { action } from "./_generated/server";

export const testUrls = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.VLY_INTEGRATION_KEY;
    if (!apiKey) return { success: false, error: "No API Key" };

    const urls = [
      "https://integrations.vly.ai/api/v1/email/send",
      "https://integrations.vly.ai/email/send",
      "https://api.vly.ai/v1/email/send",
      "https://vly.ai/api/v1/email/send",
      "https://integrations.vly.ai/v1/email/send" // The one that failed, for reference
    ];

    const results = [];

    for (const url of urls) {
      try {
        console.log(`Testing ${url}...`);
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
            subject: "Test",
            text: "Test",
          }),
        });
        
        results.push({
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
      } catch (e: any) {
        results.push({ url, error: e.message });
      }
    }

    return results;
  }
});
