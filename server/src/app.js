import express from "express";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import hpp from "hpp";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ─── Static Route Imports ──────────────────────────────────────────
import userAuthRoutes from "./routes/user.auth.routes.js";
import hostAuthRoutes from "./routes/host.auth.routes.js";
import adminAuthRoutes from "./routes/admin.auth.routes.js";
import socialAuthRoutes from "./routes/social.auth.routes.js";
import userProfileRoutes from "./routes/user.profile.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import hostListingExtraRoutes from "./routes/host.listing.extra.routes.js";
import hostRoutes from "./routes/host.routes.js";
import hostDashboardRoutes from "./routes/host.dashboard.routes.js";
import hostBookingRoutes from "./routes/host.booking.routes.js";
import hostReviewRoutes from "./routes/host.review.routes.js";
import adminDashboardRoutes from "./routes/admin.dashboard.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import geocodeRoutes from "./routes/geocode.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const app = express();

// CORS Configuration - Allow requests from frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// Security middleware
app.use(helmet());
app.use(xssClean());
app.use(hpp());

// Prevent direct browser navigation to the API
app.use((req, res, next) => {
  // Allow access to swagger docs, webhooks, and health checks
  if (
    req.path.startsWith("/api-docs") || 
    req.path.startsWith("/swagger") || 
    req.path === "/health" ||
    req.path === "/v1/payments/webhook"
  ) {
    return next();
  }
  
  // If a browser is trying to navigate to the API directly by requesting HTML, block it
  if (req.method === "GET" && req.headers.accept && req.headers.accept.includes("text/html")) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Access Denied</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f3f4f6; margin: 0; }
            .card { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 400px; border-top: 4px solid #ef4444; }
            h1 { color: #111827; margin-top: 0; font-size: 24px; }
            p { color: #6b7280; font-size: 15px; }
            .lock { width: 48px; height: 48px; color: #ef4444; margin: 0 auto 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <svg class="lock" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <h1>Application API</h1>
            <p>Direct browser access to this backend environment is restricted. Please use the designated frontend client application to communicate with these services.</p>
          </div>
        </body>
      </html>
    `);
  }
  next();
});

// Body parsing middleware — skip JSON parsing for Stripe webhook (needs raw body)
app.use((req, res, next) => {
  if (req.originalUrl === "/v1/payments/webhook") {
    return next();
  }
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Grihastha API is running" });
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Test endpoint working" });
});

// Export a function that initializes all routes and middleware
export async function initializeApp() {
  try {
    // ── Load Swagger docs (safe — YAML.load is sync but fast) ──────
    let swaggerDocument = null;
    try {
      swaggerDocument = YAML.load(join(__dirname, "../swagger.yaml"));
    } catch (err) {
      console.warn("[WARN] Could not load swagger.yaml:", err.message);
    }

    if (swaggerDocument) {
      app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument)
      );
      app.get("/swagger.yaml", (req, res) => {
        res.json(swaggerDocument);
      });
    }

    // ── Mount routes ───────────────────────────────────────────────
    app.use("/v1/auth/user", userAuthRoutes);
    app.use("/v1/auth/host", hostAuthRoutes);
    app.use("/v1/auth/admin", adminAuthRoutes);
    app.use("/v1/auth/social", socialAuthRoutes);

    // Main domain routes
    app.use("/v1/users", userProfileRoutes);
    app.use("/v1/bookings", bookingRoutes);
    app.use("/v1/wishlists", wishlistRoutes);
    app.use("/v1/reviews", reviewRoutes);
    app.use("/v1/payments", paymentRoutes);
    app.use("/v1/conversations", conversationRoutes);
    app.use("/v1/notifications", notificationRoutes);

    app.use("/v1/listings", listingRoutes);
    app.use("/v1/listings", hostListingExtraRoutes); // Mounts to /v1/listings/:id/...

    app.use("/v1/host", hostRoutes);
    app.use("/v1/host", hostDashboardRoutes);
    app.use("/v1/host/bookings", hostBookingRoutes);
    app.use("/v1/host/reviews", hostReviewRoutes);

    app.use("/v1/admin", adminDashboardRoutes);

    app.use("/v1/media", mediaRoutes);
    app.use("/v1/geocode", geocodeRoutes);

    // ── 404 and error handlers (MUST be last) ──────────────────────
    app.use((req, res) => {
      res.status(404).json({ error: "Endpoint not found", path: req.path });
    });

    app.use((err, req, res, next) => {
      console.error("Server error:", err);
      res.status(err.status || 500).json({
        error: err.message || "Internal server error",
      });
    });

    console.log("✅ All routes mounted successfully");
  } catch (error) {
    console.error("⚠️  Fatal error loading routes:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
}

export default app;
