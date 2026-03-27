console.log("[DEBUG] Starting file execution...");
console.log("[DEBUG] Loading dotenv...");
await import("dotenv/config");
console.log("[DEBUG] Loading app.js...");
const { default: app } = await import("./app.js");
console.log("[DEBUG] App loaded.");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🏠 Grihastha API server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
