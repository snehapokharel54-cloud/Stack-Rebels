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
              r.overall_rating, r.comment, r.host_reply, r.host_replied_at, 
              r.created_at, r.cleanliness, r.accuracy, r.communication, r.location, r.check_in, r.value
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.guest_id = u.id
       WHERE l.host_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [hostId, limit, offset]
    );

    // Get stats
    const stats = await query(
      `SELECT 
        COUNT(r.id)::int as total_reviews,
        COALESCE(AVG(r.overall_rating), 0)::numeric(3,2) as average_rating
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN listings l ON b.listing_id = l.id
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
  try {
    const hostId = req.user.sub;
    const { id: reviewId } = req.params;
    const { reply } = req.body;

    if (!reply) return res.status(400).json({ success: false, message: "Reply content is required." });

    // Verify ownership
    const check = await query(
      `SELECT r.id FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN listings l ON b.listing_id = l.id
       WHERE r.id = $1 AND l.host_id = $2`,
      [reviewId, hostId]
    );

    if (check.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized or review not found." });

    const result = await query(
      `UPDATE reviews SET host_reply = $1, host_replied_at = NOW()
       WHERE id = $2
       RETURNING id, host_reply, host_replied_at`,
      [reply, reviewId]
    );

    res.json({ success: true, data: result.rows[0], message: "Reply posted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /v1/host/reviews/rate-guest
 * (Placeholder for future feature: Host rating a guest)
 */
export const rateGuest = async (req, res) => {
  res.json({ success: true, message: "Guest rated successfully (Placeholder)." });
};
