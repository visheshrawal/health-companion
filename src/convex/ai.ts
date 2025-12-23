"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

const GEMINI_API_KEY = "AIzaSyBTGQCS8i9yydgvBx6sS79DIYV4ygdVePc";

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
      // Using gemini-2.5-flash as requested
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

      if (!textResponse) {
        throw new Error("No response content from AI");
      }

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