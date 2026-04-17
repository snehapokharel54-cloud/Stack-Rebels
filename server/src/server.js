import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

try {
  const { default: app, initializeApp } = await import("./app.js");

  // Initialize routes before starting server
  await initializeApp();

  const PORT = process.env.PORT || 5001;

  const server = app.listen(PORT, () => {
    console.log(`🏠 Grihastha API server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API docs:     http://localhost:${PORT}/api-docs`);
  });

  // Handle graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n[INFO] ${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log("[INFO] Server closed");
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error("[ERROR] Forced shutdown after 10 seconds");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
} catch (error) {
  console.error("[ERROR] Failed to start server:", error.message);
  console.error(error.stack);
  process.exit(1);
}
