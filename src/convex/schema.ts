import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.PATIENT),
  v.literal(ROLES.DOCTOR),
);

const schema = defineSchema(
  {
    ...authTables,
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      profileCompleted: v.optional(v.boolean()),
      
      // Patient Profile Object
      patientProfile: v.optional(v.object({
        dateOfBirth: v.string(),
        sex: v.optional(v.string()),
        bloodGroup: v.optional(v.string()),
        conditions: v.array(v.string()),
        allergies: v.array(v.string()),
        emergencyContact: v.object({
          name: v.string(),
          phone: v.string(),
          email: v.optional(v.string()),
        }),
      })),

      // Doctor Profile Object
      doctorProfile: v.optional(v.object({
        specialization: v.string(),
        licenseNumber: v.optional(v.string()),
        affiliation: v.optional(v.string()),
        bio: v.string(),
        isVerified: v.boolean(),
        availability: v.optional(v.object({
          days: v.array(v.string()), // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
          startTime: v.string(), // e.g. "09:00"
          endTime: v.string(), // e.g. "17:00"
        })),
      })),

      // Legacy fields (keeping for backward compatibility if needed, but new flow uses objects)
      age: v.optional(v.number()),
      conditions: v.optional(v.array(v.string())),
      emergencyContact: v.optional(v.object({
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
      })),
      specialization: v.optional(v.string()),
      bio: v.optional(v.string()),
    }).index("email", ["email"])
      .index("by_role", ["role"]),

    medications: defineTable({
      userId: v.id("users"),
      name: v.string(),
      dosage: v.optional(v.string()), // Kept for backward compatibility
      frequency: v.optional(v.string()), // Kept for backward compatibility
      startDate: v.number(),
      endDate: v.optional(v.number()),
      // New fields for detailed tracking
      duration: v.optional(v.number()), // days
      schedule: v.optional(v.array(v.object({
        time: v.string(), // "morning", "afternoon", "night"
        withFood: v.string(),
        quantity: v.number(),
      }))),
      instructions: v.optional(v.string()),
      // Updated log structure
      takenLog: v.array(v.union(
        v.string(), // Legacy: YYYY-MM-DD
        v.object({
          date: v.string(), // YYYY-MM-DD
          time: v.string(), // "morning", "afternoon", "night"
          status: v.string(), // "taken", "missed", "skipped"
        })
      )),
      prescriptionId: v.optional(v.id("prescriptions")),
      active: v.boolean(),
    }).index("by_user", ["userId"]),

    appointments: defineTable({
      patientId: v.id("users"),
      doctorId: v.id("users"),
      date: v.number(), // timestamp
      status: v.union(v.literal("scheduled"), v.literal("completed"), v.literal("cancelled")),
      notes: v.optional(v.string()),
      priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
      order: v.optional(v.number()),
      rescheduleRequest: v.optional(v.object({
        newDate: v.number(),
        status: v.union(v.literal("pending"), v.literal("rejected"), v.literal("suggested")),
        suggestedDate: v.optional(v.number()),
        reason: v.optional(v.string()),
      })),
    })
    .index("by_patient", ["patientId"])
    .index("by_doctor", ["doctorId"])
    .index("by_doctor_and_date", ["doctorId", "date"]),

    prescriptions: defineTable({
      doctorId: v.id("users"),
      patientId: v.id("users"),
      appointmentId: v.id("appointments"),
      notes: v.optional(v.string()),
      medications: v.array(v.object({
        name: v.string(),
        duration: v.number(),
        schedule: v.array(v.object({
          time: v.string(),
          withFood: v.string(),
          quantity: v.number(),
        })),
        instructions: v.optional(v.string()),
      })),
    }).index("by_patient", ["patientId"]),

    medicalRecords: defineTable({
      userId: v.id("users"),
      title: v.string(),
      storageId: v.id("_storage"),
      format: v.string(),
      uploadedAt: v.number(),
    }).index("by_user", ["userId"]),

    notifications: defineTable({
      userId: v.id("users"),
      title: v.string(),
      message: v.string(),
      type: v.union(v.literal("info"), v.literal("warning"), v.literal("success"), v.literal("error")),
      read: v.boolean(),
      link: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]).index("by_user_and_read", ["userId", "read"]),
    
    sos_logs: defineTable({
      userId: v.id("users"),
      contactName: v.string(),
      contactEmail: v.string(),
      location: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      status: v.string(), // "sent", "failed"
      error: v.optional(v.string()),
      sentAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;