export default {
  providers: [
    {
      // This domain is used for authentication callbacks and links.
      // Ensure CONVEX_SITE_URL is set in your Convex Dashboard > Settings > Environment Variables
      domain: process.env.CONVEX_SITE_URL || "https://your-convex-site.convex.cloud",
      applicationID: "convex",
    },
  ],
};