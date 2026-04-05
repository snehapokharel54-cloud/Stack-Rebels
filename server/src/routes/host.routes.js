import { Router } from "express";
import { verifyHost } from "../middlewares/authenticate.js";
import {
  getStats,
  getDashboard,
  getProfile,
  updateProfile,
  getEarnings,
  getBookings,
  getListingAnalytics,
  acceptBooking,
  declineBooking,
} from "../controllers/host.controller.js";
import { 
  submitPropertyVerification, 
  getPropertyVerificationStatus 
} from "../controllers/host.verification.controller.js";
import upload from "../middlewares/upload.js";

const router = Router();

// All routes require host authentication
router.use(verifyHost);

/**
 * GET /v1/host/stats
 * Get host statistics summary
 */
router.get("/stats", getStats);

/**
 * GET /v1/host/dashboard
 * Get host dashboard with stats and recent bookings
 */
router.get("/dashboard", getDashboard);

/**
 * GET /v1/host/profile
 * Get host profile information
 */
router.get("/profile", getProfile);

/**
 * PATCH /v1/host/profile
 * Update host profile
 */
router.patch("/profile", updateProfile);

/**
 * GET /v1/host/earnings
 * Get host earnings overview and monthly breakdown
 */
router.get("/earnings", getEarnings);

/**
 * GET /v1/host/bookings
 * Get all bookings for host's listings with optional filtering
 */
router.get("/bookings", getBookings);

/**
 * GET /v1/host/listings/:id/analytics
 * Get analytics for a specific listing
 */
router.get("/listings/:id/analytics", getListingAnalytics);

/**
 * POST /v1/host/listings/:id/accept-booking
 * Accept a booking request
 */
router.post("/listings/:id/accept-booking", acceptBooking);

/**
 * POST /v1/host/listings/:id/decline-booking
 * Decline a booking request with optional reason
 */
router.post("/listings/:id/decline-booking", declineBooking);

/**
 * POST /v1/host/property-verification/:listingId
 * Submit KYC documents
 */
router.post("/property-verification/:listingId", upload.any(), submitPropertyVerification);

/**
 * GET /v1/host/property-verification/:listingId
 * Get KYC status
 */
router.get("/property-verification/:listingId", getPropertyVerificationStatus);

export default router;
