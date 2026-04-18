import { query } from "../config/db.js";

/**
 * GET /v1/host/reviews/received
 * Get all reviews left by guests for the host's listings
 */
export const getReceivedReviews = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT r.id as review_id, l.id as listing_id, l.title as listing_title,
              u.full_name as guest_name, u.avatar_url as guest_avatar,
              r.rating, r.comment, r.created_at
       FROM reviews r
       JOIN listings l ON r.property_id = l.id
       JOIN users u ON r.reviewer_id = u.id
       WHERE l.host_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [hostId, limit, offset]
    );

    // Get stats
    const stats = await query(
      `SELECT 
        COUNT(r.id)::int as total_reviews,
        COALESCE(AVG(r.rating), 0)::numeric(3,2) as average_rating
       FROM reviews r
       JOIN listings l ON r.property_id = l.id
       WHERE l.host_id = $1`,
      [hostId]
    );

    res.json({ 
      success: true, 
      data: result.rows,
      stats: stats.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /v1/host/reviews/:id/reply
 * Respond to a guest's review
 */
export const replyToReview = async (req, res) => {
  res.status(501).json({ success: false, message: "Host replies to reviews are not currently supported by the database." });
};

/**
 * POST /v1/host/reviews/rate-guest
 * (Placeholder for future feature: Host rating a guest)
 */
export const rateGuest = async (req, res) => {
  res.json({ success: true, message: "Guest rated successfully (Placeholder)." });
};
