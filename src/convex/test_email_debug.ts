"use node";
import { action } from "./_generated/server";

export const testEmailIntegration = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.VLY_INTEGRATION_KEY;
    
    console.log("=== EMAIL INTEGRATION DEBUG ===");
    console.log("API Key present:", !!apiKey);
    console.log("API Key length:", apiKey?.length || 0);
    console.log("API Key prefix:", apiKey?.substring(0, 10) || "N/A");
    
    if (!apiKey) {
      return { 
        success: false, 
        error: "VLY_INTEGRATION_KEY not set in environment variables",
        instructions: "Please add VLY_INTEGRATION_KEY in the Convex dashboard under Settings > Environment Variables"
      };
    }

    const url = "https://integrations.vly.ai/v1/email/send";
    const testEmail = "test@example.com";
    const testCode = "123456";

    try {
      console.log(`Testing email send to ${testEmail}...`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
          "X-Vly-Version": "0.1.0",
        },
        body: JSON.stringify({
          to: [testEmail],
          from: "Health Companion <noreply@vly.io>",
          subject: "Test Email",
          html: `<p>Test verification code: ${testCode}</p>`,
          text: `Test verification code: ${testCode}`,
        }),
      });

      const responseText = await response.text();
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: responseText,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  },
});