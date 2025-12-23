import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) return null;
    
    const patient = await ctx.db.get(appointment.patientId);
    const doctor = await ctx.db.get(appointment.doctorId);
    
    return {
      ...appointment,
      patient,
      doctor,
    };
  },
});

export const listForPatient = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patient", (q) => q.eq("patientId", userId))
      .collect();

    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (apt) => {
        const doctor = await ctx.db.get(apt.doctorId);
        return { ...apt, doctor };
      })
    );

    return appointmentsWithDetails.sort((a, b) => a.date - b.date);
  },
});

export const listForDoctor = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctor", (q) => q.eq("doctorId", userId))
      .collect();

    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (apt) => {
        const patient = await ctx.db.get(apt.patientId);
        return { ...apt, patient };
      })
    );

    return appointmentsWithDetails.sort((a, b) => a.date - b.date);
  },
});

export const requestReschedule = mutation({
  args: {
    appointmentId: v.id("appointments"),
    newDate: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.patientId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.appointmentId, {
      rescheduleRequest: {
        newDate: args.newDate,
        status: "pending",
        reason: args.reason,
      },
    });
  },
});

export const resolveRescheduleRequest = mutation({
  args: {
    appointmentId: v.id("appointments"),
    action: v.union(v.literal("approve"), v.literal("deny"), v.literal("suggest")),
    suggestedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.doctorId !== userId) throw new Error("Unauthorized");
    if (!appointment.rescheduleRequest) throw new Error("No pending request");

    if (args.action === "approve") {
      await ctx.db.patch(args.appointmentId, {
        date: appointment.rescheduleRequest.newDate,
        rescheduleRequest: undefined, // Clear request
      });
    } else if (args.action === "deny") {
      await ctx.db.patch(args.appointmentId, {
        rescheduleRequest: {
          ...appointment.rescheduleRequest,
          status: "rejected",
        },
      });
    } else if (args.action === "suggest") {
      if (!args.suggestedDate) throw new Error("Suggested date required");
      await ctx.db.patch(args.appointmentId, {
        rescheduleRequest: {
          ...appointment.rescheduleRequest,
          status: "suggested",
          suggestedDate: args.suggestedDate,
        },
      });
    }
  },
});

export const updatePriority = mutation({
  args: {
    appointmentId: v.id("appointments"),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.doctorId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.appointmentId, { priority: args.priority });
  },
});

export const create = mutation({
  args: {
    doctorId: v.id("users"),
    date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patientId = await getAuthUserId(ctx);
    if (!patientId) throw new Error("Unauthorized");

    const appointmentId = await ctx.db.insert("appointments", {
      patientId,
      doctorId: args.doctorId,
      date: args.date,
      status: "scheduled",
      notes: args.notes,
      priority: "low",
    });

    return appointmentId;
  },
});

export const getDoctorSlots = query({
  args: { doctorId: v.id("users"), weekStart: v.number() },
  handler: async (ctx, args) => {
    // Get all appointments for this doctor in the given week
    const weekEnd = args.weekStart + (7 * 24 * 60 * 60 * 1000);
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctor_and_date", (q) => 
        q.eq("doctorId", args.doctorId).gte("date", args.weekStart).lt("date", weekEnd)
      )
      .collect();

    // Generate slots (9 AM - 5 PM, Mon-Fri)
    const slots = [];
    const start = new Date(args.weekStart);
    
    // Ensure we start at the beginning of the day if weekStart is mid-day
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) { // 7 days
      const currentDay = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
      
      // Skip weekends if needed (keeping it simple: all days)
      
      // 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        // 30 min slots
        for (let min = 0; min < 60; min += 30) {
          const slotTime = new Date(currentDay);
          slotTime.setHours(hour, min, 0, 0);
          const slotTimestamp = slotTime.getTime();

          // Check if booked
          const isBooked = appointments.some(apt => {
            // Simple check: exact match or within 30 mins
            // Assuming appointments are 30 mins
            return Math.abs(apt.date - slotTimestamp) < 1000; // Tolerance
          });

          slots.push({
            date: slotTimestamp,
            available: !isBooked,
          });
        }
      }
    }

    return slots;
  },
});