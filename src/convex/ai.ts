"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { vly } from "@/lib/vly-integrations";

const GEMINI_API_KEY = "AIzaSyBTGQCS8i9yydgvBx6sS79DIYV4ygdVePc";

// Keep Gemini fallback for audio processing only as Vly might not support audio yet
const generateContentWithFallback = async (contents: any[]) => {
  // Fallback strategy: gemini-2.5-flash -> gemini-1.5-flash
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        }
      );

      if (!response.ok) {
        // If 404 (model not found) or 429 (rate limit) or 5xx, try next
        if (response.status === 404 || response.status === 429 || response.status >= 500) {
            console.warn(`Model ${model} failed with status ${response.status}, trying next fallback...`);
            continue;
        }
        const errorText = await response.text();
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
      // Use Vly AI Integration
      const result = await vly.ai.completion({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1000,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "AI request failed");
      }

      const textResponse = result.data.choices[0]?.message?.content;
      if (!textResponse) throw new Error("No content received from AI");

      // Clean up potential markdown code blocks and extract JSON
      let jsonString = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

      const result = JSON.parse(jsonString);
      return result;
    } catch (error: any) {
      console.error("Error analyzing symptoms:", error);
      // Propagate the actual error message for debugging
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

      Rules:
      - Keep the summary concise and professional.
      - Do not include markdown formatting (like \`\`\`json), just the raw JSON string.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) throw new Error("No response content from AI");

      let jsonString = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

      const result = JSON.parse(jsonString);
      return result;
    } catch (error: any) {
      console.error("Error generating appointment summary:", error);
      // Propagate the actual error message for debugging
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
    // 1. Get the file URL
    const fileUrl = await ctx.runQuery(internal.consultations.getRecordingUrl, { 
      storageId: args.storageId 
    });

    if (!fileUrl) throw new Error("Could not get file URL");

    // 2. Fetch the audio file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) throw new Error("Failed to download audio file");
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // 3. Get appointment details to know who the patient/doctor are
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
      
      Do not include markdown formatting (like \`\`\`json), just the raw JSON string.
    `;

    try {
      const aiResponse = await generateContentWithFallback(
        [
          { parts: [{ text: prompt }] },
          {
            inlineData: {
              mimeType: "audio/mp3", // Assuming MP3 or compatible audio
              data: base64Audio
            }
          }
        ]
      );

      let jsonString = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();

      const result = JSON.parse(jsonString);
      return result;
    } catch (error: any) {
      console.error("Error processing consultation recording:", error);
      // Propagate the actual error message for debugging
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
      
      Do not include markdown formatting (like \`\`\`json), just the raw JSON string.
    `;

    try {
      const textResponse = await generateContentWithFallback([{ parts: [{ text: prompt }] }]);
      let jsonString = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

      const result = JSON.parse(jsonString);
      return result;
    } catch (error: any) {
      console.error("Error simplifying consultation:", error);
      // Propagate the actual error message for debugging
      throw new Error(`Simplification failed: ${error.message || String(error)}`);
    }
  },
});