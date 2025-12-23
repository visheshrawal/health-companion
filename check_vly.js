import * as vly from "@vly-ai/integrations";
console.log("Exports:", Object.keys(vly));
try {
  console.log("Default export keys:", Object.keys(vly.default || {}));
} catch (e) {
  console.log("No default export or error accessing it");
}
