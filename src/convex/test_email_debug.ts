"use node";
import { action } from "./_generated/server";

export const testUrls = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.VLY_INTEGRATION_KEY;
    if (!apiKey) return { success: false, error: "No API Key" };

    const urls = [
      "https://integrations.vly.ai/v1/email/send",
      "https://api.vly.ai/v1/email/send",
      "https://vly.ai/api/v1/email/send"
    ];

    const results = [];

    for (const url of urls) {
      try {
        console.log(`Testing URL: ${url}`);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            to: ["test@example.com"],
            from: "Health Companion <noreply@vly.io>",
            subject: "Debug Test",
            html: "<p>Test</p>"
          })
        });
        
        const text = await res.text();
        results.push({ url, status: res.status, response: text.substring(0, 100) });
      } catch (e: any) {
        results.push({ url, error: e.message });
      }
    }
    
    return { results };
  }
});
