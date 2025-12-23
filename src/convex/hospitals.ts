"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const searchNearby = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radius: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key is not configured on the server.");
    }

    const radius = args.radius || 10000; // Default 10km
    const type = "hospital";
    const keyword = "emergency";
    
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${args.latitude},${args.longitude}&radius=${radius}&type=${type}&keyword=${keyword}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Google Places API error:", data);
        // Don't throw to client, just return empty or error structure
        return { results: [], error: `Maps API Error: ${data.status}` };
      }

      return { results: data.results || [] };
    } catch (error: any) {
      console.error("Failed to fetch nearby hospitals:", error);
      throw new Error(error.message || "Failed to fetch nearby hospitals");
    }
  },
});
