import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

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

    // ── Import route modules ───────────────────────────────────────
    const [
      userAuthRoutes,
      hostAuthRoutes,
      adminAuthRoutes,
      listingRoutes,
      hostRoutes,
      mediaRoutes,
      geocodeRoutes,
      socialAuthRoutes,
      userProfileRoutes,
      bookingRoutes,
      wishlistRoutes,
      reviewRoutes,
      paymentRoutes,
      conversationRoutes,
      notificationRoutes,
      hostListingExtraRoutes,
      hostDashboardRoutes,
      adminDashboardRoutes,
    ] = await Promise.all([
      import("./src/routes/user.auth.routes.js"),
      import("./src/routes/host.auth.routes.js"),
      import("./src/routes/admin.auth.routes.js"),
      import("./src/routes/listing.routes.js"),
      import("./src/routes/host.routes.js"),
      import("./src/routes/media.routes.js"),
      import("./src/routes/geocode.routes.js"),
      import("./src/routes/social.auth.routes.js"),
      import("./src/routes/user.profile.routes.js"),
      import("./src/routes/booking.routes.js"),
      import("./src/routes/wishlist.routes.js"),
      import("./src/routes/review.routes.js"),
      import("./src/routes/payment.routes.js"),
      import("./src/routes/conversation.routes.js"),
      import("./src/routes/notification.routes.js"),
      import("./src/routes/host.listing.extra.routes.js"),
      import("./src/routes/host.dashboard.routes.js"),
      import("./src/routes/admin.dashboard.routes.js"),
    ]);

    // ── Mount routes ───────────────────────────────────────────────
    app.use("/v1/auth/user", userAuthRoutes.default);
    app.use("/v1/auth/host", hostAuthRoutes.default);
    app.use("/v1/auth/admin", adminAuthRoutes.default);
    app.use("/v1/auth/social", socialAuthRoutes.default);

    // Main domain routes
    app.use("/v1/users", userProfileRoutes.default);
    app.use("/v1/bookings", bookingRoutes.default);
    app.use("/v1/wishlists", wishlistRoutes.default);
    app.use("/v1/reviews", reviewRoutes.default);
    app.use("/v1/payments", paymentRoutes.default);
    app.use("/v1/conversations", conversationRoutes.default);
    app.use("/v1/notifications", notificationRoutes.default);

    app.use("/v1/listings", listingRoutes.default);
    app.use("/v1/listings", hostListingExtraRoutes.default); // Mounts to /v1/listings/:id/...

    app.use("/v1/host", hostRoutes.default);
    app.use("/v1/host", hostDashboardRoutes.default);

    app.use("/v1/admin", adminDashboardRoutes.default);

    app.use("/v1/media", mediaRoutes.default);
    app.use("/v1/geocode", geocodeRoutes.default);

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
