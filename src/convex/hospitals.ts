"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const searchNearby = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radius: v.optional(v.number()),
    keyword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDPWPSRYwKY4uszWVQ2mz5cpUGIRquzAGY";
    if (!apiKey) {
      throw new Error("Google Maps API key is not configured on the server.");
    }

    const radius = args.radius || 5000; // Default 5km
    const type = "hospital";
    const keyword = args.keyword || "emergency";
    
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${args.latitude},${args.longitude}&radius=${radius}&type=${type}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

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

export const getDetails = action({
  args: {
    place_id: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDPWPSRYwKY4uszWVQ2mz5cpUGIRquzAGY";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${args.place_id}&fields=formatted_phone_number,website&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== "OK") {
        throw new Error(`Maps API Error: ${data.status}`);
      }

      return data.result;
    } catch (error: any) {
      console.error("Failed to fetch hospital details:", error);
      throw new Error(error.message || "Failed to fetch hospital details");
    }
  },
});