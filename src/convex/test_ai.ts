"use node";
import { action } from "./_generated/server";

const GEMINI_API_KEY = "AIzaSyBTGQCS8i9yydgvBx6sS79DIYV4ygdVePc";

export const testGemini = action({
  args: {},
  handler: async (ctx) => {
    // Testing known valid models
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    
    console.log("Starting Gemini AI Test...");
    
    for (const model of models) {
      console.log(`Testing model: ${model}`);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Hello, just reply with 'Working'" }] }],
            }),
          }
        );

        console.log(`Status for ${model}: ${response.status}`);
        
        if (!response.ok) {
            const text = await response.text();
            console.log(`Error body for ${model}:`, text);
        } else {
            const data = await response.json();
            console.log(`Success for ${model}:`, JSON.stringify(data).substring(0, 200));
            return { success: true, workingModel: model, data };
        }
      } catch (e: any) {
        console.error(`Exception for ${model}:`, e.message);
      }
    }
    return { success: false, error: "All tested models failed" };
  }
});
