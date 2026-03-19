"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { VlyIntegrations } from "@vly-ai/integrations";

// SECURITY FIX: Removed the hardcoded API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Added expectJson parameter to enforce strict JSON responses from Gemini
const generateContentWithFallback = async (contents: any[], expectJson: boolean = false) => {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing from environment variables");

  // FIX: Updated to valid Gemini models
  const models = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"];
  
  const bodyPayload: any = { contents };
  
  // Enforce JSON output if requested
  if (expectJson) {
    bodyPayload.generationConfig = {
      responseMimeType: "application/json"
    };
  }

  for (const model of models) {
    try {
      console.log(`Attempting model: ${model}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Model ${model} failed (${response.status}): ${errorText}`);
        if (response.status === 404 || response.status === 429 || response.status >= 500) {
            continue;
        }
        throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
         console.warn(`Model ${model} returned no content, trying next...`);
         continue;
      }

      return textResponse;
    } catch (error: any) {
      console.error(`Error with model ${model}:`, error);
      if (model === models[models.length - 1]) {
        throw error; // Throw on last model failure
      }
    }
  }
  throw new Error("All AI models failed to generate content");
};

export const testGemini = action({
  args: {},
  handler: async (ctx) => {
    // FIX: Updated to valid Gemini models
    const models = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"];
    const results = [];
    
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Hello" }] }],
            }),
          }
        );
        
        const text = await response.text();
        results.push({ model, status: response.status, response: text.substring(0, 200) });
      } catch (e: any) {
        results.push({ model, error: e.message });
      }
    }
    return results;
  }
});

export const analyzeSymptoms = action({
  args: { symptoms: v.string() },
  handler: async (ctx, args) => {
    const prompt = `
      Act as a medical symptom checker AI. Analyze the following symptoms described by a patient:
      "${args.symptoms}"

      Provide a preliminary analysis in strict JSON format with the following structure:
      {
        "conditions": ["Condition 1", "Condition 2"],
        "urgency": "high" | "medium" | "low",
        "urgencyLabel": "Seek Immediate Care" | "Schedule Appointment Soon" | "Self-Care / Monitor",
        "recommendedActions": ["Action 1", "Action 2"],
        "summary": "Brief summary of the analysis"
      }

      Rules:
      - "high" urgency means emergency or critical condition (Red).
      - "medium" urgency means needs doctor attention soon (Yellow).
      - "low" urgency means minor issue (Green).
      - Do not include markdown formatting (like \`\`\`json), just the raw JSON string.
    `;

    try {
      const vly = new VlyIntegrations({
        token: process.env.VLY_INTEGRATION_KEY || "",
      });

      const aiResult = await vly.ai.completion({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1000,
      });

      if (!aiResult.success || !aiResult.data) {
        throw new Error(aiResult.error || "AI request failed");
      }

      const textResponse = aiResult.data.choices[0]?.message?.content;
      if (!textResponse) throw new Error("No content received from AI");

      // Keeping regex for Vly just in case gpt-4o-mini returns markdown ticks
      let jsonString = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

      const result = JSON.parse(jsonString);
      return result;
    } catch (error: any) {
      console.error("Error analyzing symptoms:", error);
      throw new Error(`Analysis failed: ${error.message || String(error)}`);
    }
  },
});

export const generateAppointmentSummary = action({
  args: { description: v.string() },
  handler: async (ctx, args) => {
    const prompt = `
      Act as a medical assistant. Summarize the following patient description for a doctor:
      "${args.description}"

      Provide the output in strict JSON format with the following structure:
      {
        "summary": "Professional medical summary of the patient's complaint (e.g., 'Patient reports 72-hour history of...')",
        "symptomSeverity": "low" | "moderate" | "severe",
        "suggestedPriority": "low" | "medium" | "high"
      }
    `;

    try {
      // Replaced fetch with our helper to utilize the fallback and clean JSON handling
      const textResponse = await generateContentWithFallback(
        [{ parts: [{ text: prompt }] }],
        true // Enforce JSON
      );

      // No regex needed anymore, guaranteed JSON
      const result = JSON.parse(textResponse);
      return result;
    } catch (error: any) {
      console.error("Error generating appointment summary:", error);
      throw new Error(`Summary generation failed: ${error.message || String(error)}`);
    }
  },
});

export const processConsultationRecording = action({
  args: {
    appointmentId: v.id("appointments"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const fileUrl = await ctx.runQuery(internal.consultations.getRecordingUrl, { 
      storageId: args.storageId 
    });

    if (!fileUrl) throw new Error("Could not get file URL");

    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) throw new Error("Failed to download audio file");
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const appointment = await ctx.runQuery(internal.appointments.getInternal, { id: args.appointmentId });
    if (!appointment) throw new Error("Appointment not found");

    const prompt = `
      You are a medical scribe. Summarize this doctor-patient consultation audio.
      
      Extract the following sections:
      1. Diagnosis or assessment
      2. Treatment plan & prescribed medications
      3. Doctor's advice & recommendations
      4. Next steps/follow-up

      Provide the output in strict JSON format with the following structure:
      {
        "diagnosis": "...",
        "treatmentPlan": "...",
        "advice": "...",
        "followUp": "..."
      }
    `;

    try {
      // FIX: Payload structure corrected. Text and inlineData are siblings inside a single 'parts' array.
      const textResponse = await generateContentWithFallback(
        [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "audio/mp3",
                  data: base64Audio
                }
              }
            ]
          }
        ],
        true // Enforce JSON
      );

      // No regex needed anymore
      const result = JSON.parse(textResponse);
      return result;
    } catch (error: any) {
      console.error("Error processing consultation recording:", error);
      throw new Error(`Processing failed: ${error.message || String(error)}`);
    }
  },
});

export const simplifyConsultation = action({
  args: { summary: v.string() },
  handler: async (ctx, args) => {
    const prompt = `
      Analyze this consultation summary and make it more patient-friendly.
      Original: "${args.summary}"
      
      Return a JSON object with the following structure:
      {
        "explanation": "Simplified explanation in plain English",
        "actionItems": ["Action 1", "Action 2", "Action 3"],
        "warningSigns": ["Warning 1", "Warning 2"],
        "encouragement": "Motivation encouragement"
      }
    `;

    try {
      const textResponse = await generateContentWithFallback(
        [{ parts: [{ text: prompt }] }],
        true // Enforce JSON
      );
      
      // No regex needed anymore
      const result = JSON.parse(textResponse);
      return result;
    } catch (error: any) {
      console.error("Error simplifying consultation:", error);
      throw new Error(`Simplification failed: ${error.message || String(error)}`);
    }
  },
});
