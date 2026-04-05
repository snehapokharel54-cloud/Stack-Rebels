import { query } from "../config/db.js";
import { uploadImage } from "../config/cloudinary.js";

/**
 * Create a new blank listing (DRAFT)
 * POST /v1/listings
 */
export const createListing = async (req, res) => {
  try {
    const hostId = req.user?.role === "host" ? req.user.sub : req.user?.id;

    if (!hostId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Host ID not found.",
        errors: [],
      });
    }

    // Verify the user is a host
    const hostCheck = await query(
      "SELECT is_host FROM users WHERE id = $1",
      [hostId]
    );

    if (!hostCheck.rows[0]?.is_host) {
      return res.status(403).json({
        success: false,
        message: "Only hosts can create listings.",
        errors: [],
      });
    }

    // Create blank listing with DRAFT status
    const result = await query(
      `INSERT INTO listings (host_id, status)
       VALUES ($1, $2)
       RETURNING id, host_id, status, created_at`,
      [hostId, "DRAFT"]
    );

    const listing = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Listing created successfully.",
      data: listing,
    });
  } catch (error) {
    console.error("Create listing error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
};

/**
 * Get a listing by ID (for hosts to edit, or guests to view if published)
 * GET /v1/listings/:id
 */
export const getListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await query(
      "SELECT * FROM listings WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
        errors: [],
      });
    }

    const listing = result.rows[0];

    // Check permissions
    if (listing.status === "DRAFT" && listing.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot access draft listings that are not yours.",
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error("Get listing error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
};

/**
 * Update a listing (partial update for multi-step form)
 * PATCH /v1/listings/:id
 */
export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === "host" ? req.user.sub : req.user?.id;
    const updates = req.body;

    console.log(`[UPDATE] Listing ID: ${id}, Host ID: ${userId}`);
    console.log(`[UPDATE] Received data:`, JSON.stringify(updates, null, 2));

    // Verify ownership
    const listingCheck = await query(
      "SELECT host_id FROM listings WHERE id = $1",
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
        errors: [],
      });
    }

    if (listingCheck.rows[0].host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own listings.",
        errors: [],
      });
    }

    // Build dynamic UPDATE query
    const allowedFields = [
      "title",
      "description",
      "category",
      "address",
      "floor_plan",
      "amenities",
      "photos",
      "price_per_night",
      "minimum_night_stay",
      "maximum_night_stay",
      "instant_book_enabled",
    ];

    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      
      if (allowedFields.includes(snakeKey) && value !== undefined) {
        console.log(`[UPDATE] Setting ${snakeKey} =`, value);
        fields.push(`${snakeKey} = $${paramCount}`);
        // Convert objects/arrays to JSON
        if (typeof value === "object" && value !== null) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramCount++;
      } else if (!allowedFields.includes(snakeKey)) {
        console.log(`[UPDATE] Skipping disallowed field: ${snakeKey}`);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update.",
        errors: [],
      });
    }

    values.push(id);
    const updateQuery = `
      UPDATE listings
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    console.log(`[UPDATE] Query:`, updateQuery);
    console.log(`[UPDATE] Values:`, values);

    const result = await query(updateQuery, values);

    console.log(`[UPDATE] Success. Updated listing:`, result.rows[0]);

    return res.status(200).json({
      success: true,
      message: "Listing updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update listing error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
};

/**
 * Publish a listing (change status from DRAFT to PUBLISHED)
 * POST /v1/listings/:id/publish
 */
export const publishListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === "host" ? req.user.sub : req.user?.id;

    // Verify ownership
    const listingCheck = await query(
      "SELECT * FROM listings WHERE id = $1",
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
        errors: [],
      });
    }

    const listing = listingCheck.rows[0];

    if (listing.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only publish your own listings.",
        errors: [],
      });
    }

    // Check if listing has all required fields
    const missingFields = [];
    if (!listing.title) missingFields.push("title");
    if (!listing.category) missingFields.push("category/property type");
    if (!listing.address) missingFields.push("address/location");
    if (!listing.price_per_night) missingFields.push("price per night");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Listing is incomplete. Missing: ${missingFields.join(", ")}. Please fill in all required fields before publishing.`,
        errors: missingFields,
      });
    }

    // Update status to PUBLISHED
    const result = await query(
      `UPDATE listings
       SET status = $1, published_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      ["PUBLISHED", id]
    );

    return res.status(200).json({
      success: true,
      message: "Listing published successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Publish listing error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
};

/**
 * Search published listings (Airbnb-style guest search)
 * GET /v1/listings/search
 *
 * Query parameters:
 *   location    – text search across city, province, street
 *   city        – filter by city (legacy, still supported)
 *   checkIn     – ISO date string (YYYY-MM-DD)
 *   checkOut    – ISO date string (YYYY-MM-DD)
 *   adults      – number of adults (13+)
 *   children    – number of children (2-12)
 *   infants     – number of infants (under 2) — informational only
 *   pets        – number of pets — informational only
 *   guests      – total guests (legacy, still supported)
 *   minPrice    – minimum price per night
 *   maxPrice    – maximum price per night
 *   category    – property type filter
 *   amenities   – comma-separated list of required amenities
 *   sortBy      – "price_asc" | "price_desc" | "newest" | "rating" (default: newest)
 *   limit       – results per page (default: 20, max: 50)
 *   offset      – pagination offset (default: 0)
 */
export const searchListings = async (req, res) => {
  try {
    const {
      location,
      city,
      checkIn,
      checkOut,
      adults,
      children,
      infants,
      pets,
      guests,
      minPrice,
      maxPrice,
      category,
      amenities,
      sortBy,
      limit: rawLimit,
      offset: rawOffset,
    } = req.query;

    let whereClause = ["l.status = 'PUBLISHED'"];
    const values = [];
    let paramCount = 1;

    // ── Location search (searches city, province, street) ─────────
    if (location) {
      whereClause.push(
        `(l.address->>'city' ILIKE $${paramCount}
          OR l.address->>'province' ILIKE $${paramCount}
          OR l.address->>'street' ILIKE $${paramCount}
          OR l.title ILIKE $${paramCount})`
      );
      values.push(`%${location}%`);
      paramCount++;
    }

    // Legacy city filter
    if (city && !location) {
      whereClause.push(`l.address->>'city' ILIKE $${paramCount}`);
      values.push(`%${city}%`);
      paramCount++;
    }

    // ── Date availability (exclude listings with overlapping bookings) ─
    if (checkIn && checkOut) {
      whereClause.push(
        `NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.listing_id = l.id
            AND b.status IN ('PENDING', 'CONFIRMED')
            AND b.check_in < $${paramCount + 1}::date
            AND b.check_out > $${paramCount}::date
        )`
      );
      values.push(checkIn, checkOut);
      paramCount += 2;

      // Also enforce minimum/maximum night stay
      whereClause.push(
        `(l.minimum_night_stay IS NULL OR l.minimum_night_stay <= ($${paramCount}::date - $${paramCount - 2}::date))`
      );
      values.push(checkOut);
      paramCount++;
    }

    // ── Guest capacity ────────────────────────────────────────────
    const totalGuests =
      (parseInt(adults, 10) || 0) +
      (parseInt(children, 10) || 0) +
      (parseInt(guests, 10) || 0);

    if (totalGuests > 0) {
      whereClause.push(
        `(l.floor_plan->>'guests')::INTEGER >= $${paramCount}`
      );
      values.push(totalGuests);
      paramCount++;
    }

    // ── Price range ───────────────────────────────────────────────
    if (minPrice) {
      whereClause.push(`l.price_per_night >= $${paramCount}`);
      values.push(parseFloat(minPrice));
      paramCount++;
    }
    if (maxPrice) {
      whereClause.push(`l.price_per_night <= $${paramCount}`);
      values.push(parseFloat(maxPrice));
      paramCount++;
    }

    // ── Category ──────────────────────────────────────────────────
    if (category) {
      whereClause.push(`l.category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    // ── Amenities (listing must contain ALL requested amenities) ──
    if (amenities) {
      const amenityList = amenities.split(",").map((a) => a.trim());
      for (const amenity of amenityList) {
        whereClause.push(`l.amenities @> $${paramCount}::jsonb`);
        values.push(JSON.stringify([amenity]));
        paramCount++;
      }
    }

    // ── Sorting ───────────────────────────────────────────────────
    let orderBy = "l.created_at DESC"; // default: newest
    if (sortBy === "price_asc") orderBy = "l.price_per_night ASC NULLS LAST";
    else if (sortBy === "price_desc")
      orderBy = "l.price_per_night DESC NULLS LAST";
    else if (sortBy === "rating") orderBy = "l.created_at DESC"; // placeholder until ratings aggregated

    // ── Pagination ────────────────────────────────────────────────
    const limit = Math.min(parseInt(rawLimit, 10) || 20, 50);
    const offset = parseInt(rawOffset, 10) || 0;

    // ── Count query (for pagination metadata) ─────────────────────
    const countQuery = `
      SELECT COUNT(*) as total
      FROM listings l
      WHERE ${whereClause.join(" AND ")}
    `;

    // ── Main search query ─────────────────────────────────────────
    const searchQuery = `
      SELECT
        l.id,
        l.host_id,
        l.title,
        l.description,
        l.category,
        l.address,
        l.floor_plan,
        l.amenities,
        l.photos,
        l.price_per_night,
        l.minimum_night_stay,
        l.maximum_night_stay,
        l.instant_book_enabled,
        l.published_at,
        l.created_at,
        l.updated_at,
        u.full_name  AS host_name,
        u.avatar_url  AS host_avatar,
        u.is_superhost AS host_is_superhost
      FROM listings l
      JOIN users u ON u.id = l.host_id
      WHERE ${whereClause.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);

    const [countResult, searchResult] = await Promise.all([
      query(countQuery, values.slice(0, -2)),
      query(searchQuery, values),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);

    return res.status(200).json({
      success: true,
      data: searchResult.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Search listings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
};

/**
 * Get all listings for a specific host
 * GET /v1/listings/host/my-listings
 */
export const getHostListings = async (req, res) => {
  try {
    const hostId = req.user?.role === "host" ? req.user.sub : req.user?.id;

    if (!hostId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
        errors: [],
      });
    }

    const result = await query(
      `SELECT * FROM listings
       WHERE host_id = $1
       ORDER BY created_at DESC`,
      [hostId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Get host listings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
};

/**
 * Delete a listing (only draft listings)
 * DELETE /v1/listings/:id
 */
export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === "host" ? req.user.sub : req.user?.id;

    // Verify ownership and status
    const listingCheck = await query(
      "SELECT * FROM listings WHERE id = $1",
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
        errors: [],
      });
    }

    const listing = listingCheck.rows[0];

    if (listing.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own listings.",
        errors: [],
      });
    }

    if (listing.status === "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete published listings. Unpublish first.",
        errors: [],
      });
    }

    // Delete the listing
    await query("DELETE FROM listings WHERE id = $1", [id]);

    return res.status(200).json({
      success: true,
      message: "Listing deleted successfully.",
    });
  } catch (error) {
    console.error("Delete listing error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
};

/**
 * Upload photos for a listing to Cloudinary
 * POST /v1/listings/:id/photos
 */
export const uploadListingPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === "host" ? req.user.sub : req.user?.id;

    // Check if files were provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files provided. Please upload at least one photo.",
        errors: [],
      });
    }

    // Verify ownership
    const listingCheck = await query(
      "SELECT photos FROM listings WHERE id = $1",
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
        errors: [],
      });
    }

    // Verify host owns the listing
    const ownerCheck = await query(
      "SELECT host_id FROM listings WHERE id = $1",
      [id]
    );

    if (ownerCheck.rows[0].host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own listings.",
        errors: [],
      });
    }

    // Upload files to Cloudinary
    const uploadedPhotos = [];
    const uploadPromises = req.files.map((file) =>
      uploadImage(file.buffer, {
        folder: `grihastha/listings/${id}`,
        resource_type: "image",
        format: "webp", // Convert to WebP for optimization
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Extract URLs and metadata from upload results
    uploadResults.forEach((result) => {
      uploadedPhotos.push({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    });

    // Get current photos
    const currentPhotos = listingCheck.rows[0].photos || [];

    // Combine old and new photos
    const updatedPhotos = [...currentPhotos, ...uploadedPhotos];

    // Update listing with new photos
    await query(
      "UPDATE listings SET photos = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(updatedPhotos), id]
    );

    return res.status(200).json({
      success: true,
      message: "Photos uploaded successfully to Cloudinary.",
      data: {
        id,
        photos: updatedPhotos,
      },
    });
  } catch (error) {
    console.error("Upload photos error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload photos: " + error.message,
      errors: [],
    });
  }
};
