import db from "../config/db.js";

/**
 * GET /v1/host/stats
 * Get host statistics summary
 */
export const getStats = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;

    if (!hostId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Host ID not found in token.",
        errors: [],
      });
    }

    // Get basic host stats from listings
    let stats = {
      total_listings: 0,
      published_listings: 0,
      draft_listings: 0,
      monthly_earnings: 0,
      total_bookings: 0,
    };

    try {
      const statsResult = await db.query(
        `SELECT 
          COUNT(*) as total_listings,
          COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published_listings,
          COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_listings
        FROM listings WHERE host_id = $1`,
        [hostId]
      );

      if (statsResult.rows[0]) {
        stats.total_listings = parseInt(statsResult.rows[0].total_listings) || 0;
        stats.published_listings = parseInt(statsResult.rows[0].published_listings) || 0;
        stats.draft_listings = parseInt(statsResult.rows[0].draft_listings) || 0;
      }
    } catch (error) {
      console.error("Error fetching listing stats:", error.message);
      // Continue with zeros if query fails
    }

    // Try to get earnings and bookings (these tables may not exist yet)
    try {
      const earningsResult = await db.query(
        `SELECT COALESCE(SUM(b.total_price), 0) as monthly_earnings
         FROM bookings b
         JOIN listings l ON b.listing_id = l.id
         WHERE l.host_id = $1 
         AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', NOW())`,
        [hostId]
      );

      if (earningsResult.rows[0]) {
        stats.monthly_earnings = parseFloat(earningsResult.rows[0].monthly_earnings) || 0;
      }
    } catch (error) {
      console.warn("Bookings table not available yet, skipping earnings calc:", error.message);
      // Continue with zero earnings
    }

    try {
      const bookingsCount = await db.query(
        `SELECT COUNT(*) as total_bookings
         FROM bookings b
         JOIN listings l ON b.listing_id = l.id
         WHERE l.host_id = $1`,
        [hostId]
      );

      if (bookingsCount.rows[0]) {
        stats.total_bookings = parseInt(bookingsCount.rows[0].total_bookings) || 0;
      }
    } catch (error) {
      console.warn("Bookings table not available yet, skipping bookings count:", error.message);
      // Continue with zero bookings
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats: " + error.message,
      errors: [],
    });
  }
};

/**
 * GET /v1/host/dashboard
 * Get host dashboard with statistics
 */
export const getDashboard = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;

    if (!hostId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Host ID not found in token.",
      });
    }

    // Get basic host stats
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total_listings,
        COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published_listings,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_listings
      FROM listings WHERE host_id = $1`,
      [hostId]
    );

    const stats = statsResult.rows[0];
    let recentBookings = [];
    let monthlyEarnings = 0;

    // Try to get recent bookings (bookings table may not exist yet)
    try {
      const bookingsResult = await db.query(
        `SELECT b.*, l.category, l.address FROM bookings b
         JOIN listings l ON b.listing_id = l.id
         WHERE l.host_id = $1
         ORDER BY b.created_at DESC
         LIMIT 5`,
        [hostId]
      );
      recentBookings = bookingsResult.rows;
    } catch (err) {
      console.warn("Bookings table not available yet, using empty bookings list:", err.message);
    }

    // Try to get earnings this month
    try {
      const earningsResult = await db.query(
        `SELECT COALESCE(SUM(b.total_price), 0) as monthly_earnings
         FROM bookings b
         JOIN listings l ON b.listing_id = l.id
         WHERE l.host_id = $1 
         AND DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', NOW())`,
        [hostId]
      );
      monthlyEarnings = parseFloat(earningsResult.rows[0].monthly_earnings);
    } catch (err) {
      console.warn("Bookings table not available yet, using zero earnings:", err.message);
    }

    res.json({
      success: true,
      data: {
        stats: {
          total_listings: parseInt(stats.total_listings),
          published_listings: parseInt(stats.published_listings),
          draft_listings: parseInt(stats.draft_listings),
        },
        monthly_earnings: monthlyEarnings,
        recent_bookings: recentBookings,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard: " + error.message });
  }
};

/**
 * GET /v1/host/profile
 * Get host profile information
 */
export const getProfile = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;

    const result = await db.query(
      `SELECT id, email, full_name, phone, created_at, updated_at FROM users WHERE id = $1 AND role = 'host'`,
      [hostId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Host not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

/**
 * PATCH /v1/host/profile
 * Update host profile
 */
export const updateProfile = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;
    const { full_name, phone } = req.body;

    const result = await db.query(
      `UPDATE users SET full_name = $1, phone = $2, updated_at = NOW()
       WHERE id = $3 AND role = 'host'
       RETURNING id, email, full_name, phone, created_at, updated_at`,
      [full_name, phone, hostId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Host not found" });
    }

    res.json({ success: true, data: result.rows[0], message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

/**
 * GET /v1/host/earnings
 * Get host earnings overview
 */
export const getEarnings = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;

    if (!hostId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Host ID not found in token.",
      });
    }

    let totalEarnings = 0;
    let monthlyBreakdown = [];

    try {
      // Total earnings
      const totalResult = await db.query(
        `SELECT COALESCE(SUM(b.total_price), 0) as total_earnings
         FROM bookings b
         JOIN listings l ON b.listing_id = l.id
         WHERE l.host_id = $1`,
        [hostId]
      );
      totalEarnings = parseFloat(totalResult.rows[0].total_earnings);

      // Monthly breakdown
      const monthlyResult = await db.query(
        `SELECT 
          DATE_TRUNC('month', b.created_at)::date as month,
          COALESCE(SUM(b.total_price), 0) as earnings
         FROM bookings b
         JOIN listings l ON b.listing_id = l.id
         WHERE l.host_id = $1
         GROUP BY DATE_TRUNC('month', b.created_at)
         ORDER BY month DESC
         LIMIT 12`,
        [hostId]
      );
      monthlyBreakdown = monthlyResult.rows.map(row => ({
        month: row.month,
        earnings: parseFloat(row.earnings),
      }));
    } catch (err) {
      console.warn("Bookings table not available yet, using zero earnings:", err.message);
    }

    res.json({
      success: true,
      data: {
        total_earnings: totalEarnings,
        monthly_breakdown: monthlyBreakdown,
      },
    });
  } catch (error) {
    console.error("Earnings fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch earnings: " + error.message });
  }
};

/**
 * GET /v1/host/bookings
 * Get all bookings for host's listings
 */
export const getBookings = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;
    const { status, limit = 20, offset = 0 } = req.query;

    if (!hostId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Host ID not found in token.",
        errors: [],
      });
    }

    let query = `SELECT b.*, l.category, l.address, u.full_name as guest_name, u.email as guest_email
                 FROM bookings b
                 JOIN listings l ON b.listing_id = l.id
                 JOIN users u ON b.guest_id = u.id
                 WHERE l.host_id = $1`;
    const params = [hostId];

    if (status) {
      query += ` AND b.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.warn("Bookings fetch error (table may not exist yet):", error.message);
    // Return empty bookings list if table doesn't exist
    res.json({
      success: true,
      data: [],
      limit: 20,
      offset: 0,
      message: "Bookings table not yet available",
    });
  }
};

/**
 * GET /v1/host/listings/:id/analytics
 * Get analytics for a specific listing
 */
export const getListingAnalytics = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;
    const { id: listingId } = req.params;

    // Verify ownership
    const ownerCheck = await db.query(
      `SELECT id FROM listings WHERE id = $1 AND host_id = $2`,
      [listingId, hostId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Get listing stats
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        AVG(CAST(rating AS FLOAT)) as avg_rating,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_bookings
       FROM bookings WHERE listing_id = $1`,
      [listingId]
    );

    // Get views and inquiries
    const engagementResult = await db.query(
      `SELECT 
        COUNT(*) as views,
        COUNT(CASE WHEN type = 'inquiry' THEN 1 END) as inquiries
       FROM listing_engagement WHERE listing_id = $1`,
      [listingId]
    );

    const stats = statsResult.rows[0];
    const engagement = engagementResult.rows[0] || { views: 0, inquiries: 0 };

    res.json({
      success: true,
      data: {
        total_bookings: parseInt(stats.total_bookings),
        avg_rating: stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(2) : 0,
        confirmed_bookings: parseInt(stats.confirmed_bookings),
        views: parseInt(engagement.views),
        inquiries: parseInt(engagement.inquiries),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

/**
 * POST /v1/host/listings/:id/accept-booking
 * Accept a booking
 */
export const acceptBooking = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;
    const { id: bookingId } = req.params;

    // Verify host owns the listing
    const verifyResult = await db.query(
      `SELECT b.id FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       WHERE b.id = $1 AND l.host_id = $2`,
      [bookingId, hostId]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await db.query(
      `UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId]
    );

    res.json({ success: true, data: result.rows[0], message: "Booking accepted" });
  } catch (error) {
    console.error("Accept booking error:", error);
    res.status(500).json({ success: false, message: "Failed to accept booking" });
  }
};

/**
 * POST /v1/host/listings/:id/decline-booking
 * Decline a booking
 */
export const declineBooking = async (req, res) => {
  try {
    const hostId = req.user?.sub || req.user?.id;
    const { id: bookingId } = req.params;
    const { reason } = req.body;

    // Verify host owns the listing
    const verifyResult = await db.query(
      `SELECT b.id FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       WHERE b.id = $1 AND l.host_id = $2`,
      [bookingId, hostId]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await db.query(
      `UPDATE bookings SET status = 'REJECTED', cancellation_reason = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId, reason]
    );

    res.json({ success: true, data: result.rows[0], message: "Booking declined" });
  } catch (error) {
    console.error("Decline booking error:", error);
    res.status(500).json({ success: false, message: "Failed to decline booking" });
  }
};
