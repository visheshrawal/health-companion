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
      
      // Patient specific
      age: v.optional(v.number()),
      conditions: v.optional(v.array(v.string())),
      emergencyContact: v.optional(v.object({
        name: v.string(),
        phone: v.string(),
      })),

      // Doctor specific
      specialization: v.optional(v.string()),
      bio: v.optional(v.string()),
    }).index("email", ["email"])
      .index("by_role", ["role"]),

    medications: defineTable({
      userId: v.id("users"),
      name: v.string(),
      dosage: v.string(),
      frequency: v.string(),
      startDate: v.number(),
      endDate: v.optional(v.number()),
      takenLog: v.array(v.string()), // Array of YYYY-MM-DD strings
      prescriptionId: v.optional(v.id("prescriptions")),
      active: v.boolean(),
    }).index("by_user", ["userId"]),

    appointments: defineTable({
      patientId: v.id("users"),
      doctorId: v.id("users"),
      date: v.number(), // timestamp
      status: v.union(v.literal("scheduled"), v.literal("completed"), v.literal("cancelled")),
      notes: v.optional(v.string()),
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
        dosage: v.string(),
        frequency: v.string(),
      })),
    }).index("by_patient", ["patientId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;