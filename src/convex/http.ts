import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

// Add auth routes
auth.addHttpRoutes(http);

// Add a test route to verify HTTP router is working
http.route({
  path: "/test-http",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response("HTTP Router is working", { status: 200 });
  }),
});

export default http;