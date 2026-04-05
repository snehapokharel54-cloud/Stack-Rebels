import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

// Route imports
import userAuthRoutes from "./routes/user.auth.routes.js";
import hostAuthRoutes from "./routes/host.auth.routes.js";
import adminAuthRoutes from "./routes/admin.auth.routes.js";

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL, process.env.ADMIN_PANEL_URL],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Root Endpoint ──────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Grihastha API",
    data: { version: "1.0.0", timestamp: new Date().toISOString() },
  });
});

// ─── Health Check ────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Grihastha API is running.",
    data: { timestamp: new Date().toISOString() },
  });
});

// ─── Swagger Documentation ───────────────────────────────────────────
const swaggerDocument = YAML.load(path.join(process.cwd(), "swagger.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── Mount Auth Routes ───────────────────────────────────────────────
app.use("/v1/auth/user", userAuthRoutes);
app.use("/v1/auth/host", hostAuthRoutes);
app.use("/v1/auth/admin", adminAuthRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    errors: [],
  });
});

// ─── Global Error Handler ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
    errors: [],
  });
});

export default app;
