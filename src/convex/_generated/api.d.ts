/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as ai from "../ai.js";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as cleanup from "../cleanup.js";
import type * as consultations from "../consultations.js";
import type * as content from "../content.js";
import type * as debug from "../debug.js";
import type * as http from "../http.js";
import type * as medicalRecords from "../medicalRecords.js";
import type * as medications from "../medications.js";
import type * as notifications from "../notifications.js";
import type * as prescriptions from "../prescriptions.js";
import type * as sos from "../sos.js";
import type * as sosLogs from "../sosLogs.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  ai: typeof ai;
  appointments: typeof appointments;
  auth: typeof auth;
  cleanup: typeof cleanup;
  consultations: typeof consultations;
  content: typeof content;
  debug: typeof debug;
  http: typeof http;
  medicalRecords: typeof medicalRecords;
  medications: typeof medications;
  notifications: typeof notifications;
  prescriptions: typeof prescriptions;
  sos: typeof sos;
  sosLogs: typeof sosLogs;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
