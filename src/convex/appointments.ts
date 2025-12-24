import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
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
        let imageUrl = null;
        if (doctor?.image) {
          imageUrl = await ctx.storage.getUrl(doctor.image);
        }
        return { ...apt, doctor: doctor ? { ...doctor, imageUrl } : null };
      })
    );

    return appointmentsWithDetails.sort((a, b) => {
      // Sort by order if available, otherwise by date
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return a.date - b.date;
    });
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
        let imageUrl = null;
        if (patient?.image) {
          imageUrl = await ctx.storage.getUrl(patient.image);
        }
        return { ...apt, patient: patient ? { ...patient, imageUrl } : null };
      })
    );

    return appointmentsWithDetails.sort((a, b) => a.date - b.date);
  },
});

export const getCompletedAppointments = query({
  args: {
    doctorId: v.optional(v.id("users")),
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return [];
    
    // If doctorId is not provided, use the current user's ID (assuming they are a doctor)
    // But we need to find the user record first to get the ID if we rely on auth
    // For now, let's assume the frontend passes the ID or we look it up.
    // Better to look up the user from auth to be secure.
    
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", user.email!))
      .unique();
      
    if (!userRecord) return [];
    
    const doctorId = args.doctorId || userRecord._id;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctor_and_date", (q) => 
        q.eq("doctorId", doctorId).gte("date", args.start).lte("date", args.end)
      )
      .collect();
      
    return appointments.filter(a => a.status === "completed");
  }
});

export const getDoctorStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctor", (q) => q.eq("doctorId", userId))
      .collect();

    // Return all appointments so we can analyze both completed and scheduled if needed, 
    // but the prompt specifically asked for "visited", so we'll focus on completed in the frontend or here.
    // Let's return completed ones for the analysis.
    return appointments.filter(a => a.status === "completed");
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

    // Notify patient
    await ctx.db.insert("notifications", {
      userId: appointment.patientId,
      title: "Appointment Update",
      message: `Your appointment on ${new Date(appointment.date).toLocaleDateString()} has been marked as ${args.priority} priority.`,
      type: "info",
      read: false,
      createdAt: Date.now(),
      link: "/patient/appointments",
    });
  },
});

export const updateOrder = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("appointments"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    for (const update of args.updates) {
      const apt = await ctx.db.get(update.id);
      if (apt && apt.doctorId === userId) {
        await ctx.db.patch(update.id, { order: update.order });
      }
    }
  },
});

export const create = mutation({
  args: {
    doctorId: v.id("users"),
    date: v.number(),
    notes: v.optional(v.string()),
    patientDescription: v.optional(v.string()),
    aiEnhancedSummary: v.optional(v.string()),
    showOriginalToDoctor: v.optional(v.boolean()),
    symptomSeverity: v.optional(v.string()),
    suggestedPriority: v.optional(v.string()),
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
      patientDescription: args.patientDescription,
      aiEnhancedSummary: args.aiEnhancedSummary,
      showOriginalToDoctor: args.showOriginalToDoctor,
      symptomSeverity: args.symptomSeverity,
      suggestedPriority: args.suggestedPriority,
    });

    return appointmentId;
  },
});

export const getDoctorSlots = query({
  args: { doctorId: v.id("users"), date: v.number() }, // date is timestamp of the day (midnight)
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor || !doctor.doctorProfile) return [];

    const availability = doctor.doctorProfile.availability || {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "09:00",
      endTime: "17:00"
    };

    const dayDate = new Date(args.date);
    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"...

    // Check if doctor works on this day
    if (!availability.days.includes(dayName)) {
      return [];
    }

    // Parse start and end times
    const [startHour, startMin] = availability.startTime.split(':').map(Number);
    const [endHour, endMin] = availability.endTime.split(':').map(Number);

    const dayStart = new Date(dayDate);
    dayStart.setHours(startHour, startMin, 0, 0);
    
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(endHour, endMin, 0, 0);

    // Get existing appointments for this doctor on this day
    // We'll query a range covering the whole day to be safe
    const queryStart = new Date(args.date);
    queryStart.setHours(0,0,0,0);
    const queryEnd = new Date(args.date);
    queryEnd.setHours(23,59,59,999);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctor_and_date", (q) => 
        q.eq("doctorId", args.doctorId).gte("date", queryStart.getTime()).lt("date", queryEnd.getTime())
      )
      .collect();

    const slots = [];
    let currentSlot = new Date(dayStart);

    while (currentSlot < dayEnd) {
      const slotTimestamp = currentSlot.getTime();
      
      // Check if booked
      const isBooked = appointments.some(apt => {
        // Assuming 30 min slots for now, check if any appointment starts within this slot
        // or if the slot is within an appointment (if we had duration)
        // For MVP, simple collision check
        return Math.abs(apt.date - slotTimestamp) < 1000; 
      });

      // Also check if slot is in the past
      const isPast = slotTimestamp < Date.now();

      slots.push({
        date: slotTimestamp,
        available: !isBooked && !isPast,
      });

      // Increment by 30 mins
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    return slots;
  },
});

export const getInternal = internalQuery({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});