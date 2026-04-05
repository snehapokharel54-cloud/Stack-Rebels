import { Router } from "express";
import { verifyHost } from "../middlewares/authenticate.js";
import upload from "../middlewares/upload.js";
import {
  createListing,
  getListing,
  updateListing,
  publishListing,
  searchListings,
  getHostListings,
  deleteListing,
  uploadListingPhotos,
} from "../controllers/listing.controller.js";

const router = Router();

// ─── Public Routes (No auth required) ────────────────────────────────
/**
 * GET /v1/listings/search
 * Search published listings with filters
 */
router.get("/search", searchListings);

// ─── Protected Routes (Auth required) ────────────────────────────────

/**
 * POST /v1/listings
 * Create a new blank listing (DRAFT)
 */
router.post("/", verifyHost, createListing);

/**
 * GET /v1/listings/host/my-listings
 * Get all listings for the authenticated host
 */
router.get("/host/my-listings", verifyHost, getHostListings);

/**
 * GET /v1/listings/:id
 * Get a single listing by ID
 */
router.get("/:id", getListing);

/**
 * PATCH /v1/listings/:id
 * Update a listing (multi-step form)
 */
router.patch("/:id", verifyHost, updateListing);

/**
 * POST /v1/listings/:id/photos
 * Upload photos for a listing to Cloudinary
 */
router.post("/:id/photos", verifyHost, upload.array("photos"), uploadListingPhotos);

/**
 * POST /v1/listings/:id/publish
 * Publish a draft listing
 */
router.post("/:id/publish", verifyHost, publishListing);

/**
 * DELETE /v1/listings/:id
 * Delete a draft listing
 */
router.delete("/:id", verifyHost, deleteListing);

export default router;
