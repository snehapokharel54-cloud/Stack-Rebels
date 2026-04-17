import { query } from "../config/db.js";

// Guest submits a review
export const createReview = async (req, res) => { 
  try {
    const userId = req.user.sub;
    const { booking_id, overall_rating, cleanliness, accuracy, communication, location, check_in, value, comment } = req.body;

    // Verify booking belongs to user and is completed
    const bookingCheck = await query(
      "SELECT id, status FROM bookings WHERE id = $1 AND guest_id = $2",
      [booking_id, userId]
    );

    if (bookingCheck.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized or booking not found" });
    if (bookingCheck.rows[0].status !== 'completed') return res.status(400).json({ success: false, message: "Can only review completed bookings" });

    // Insert review
    const result = await query(
      `INSERT INTO reviews (booking_id, overall_rating, cleanliness, accuracy, communication, location, check_in, value, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id as review_id, overall_rating, comment, created_at`,
      [booking_id, overall_rating, cleanliness, accuracy, communication, location, check_in, value, comment]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ success: false, message: "You have already reviewed this booking" });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public listing reviews
export const getListingReviews = async (req, res) => { 
  try {
    const { id: listingId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const stats = await query(
      `SELECT 
        COUNT(r.id)::int as total_reviews,
        COALESCE(AVG(r.overall_rating), 0)::numeric(3,2) as average_rating,
        COALESCE(AVG(r.cleanliness), 0)::numeric(3,2) as cleanliness,
        COALESCE(AVG(r.accuracy), 0)::numeric(3,2) as accuracy,
        COALESCE(AVG(r.communication), 0)::numeric(3,2) as communication,
        COALESCE(AVG(r.location), 0)::numeric(3,2) as location,
        COALESCE(AVG(r.check_in), 0)::numeric(3,2) as check_in,
        COALESCE(AVG(r.value), 0)::numeric(3,2) as value
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       WHERE b.listing_id = $1`,
      [listingId]
    );

    const reviews = await query(
      `SELECT r.id as review_id, u.full_name as guest_name, u.avatar_url as guest_avatar,
              r.overall_rating, r.comment, r.host_reply, r.created_at
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN users u ON b.guest_id = u.id
       WHERE b.listing_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [listingId, limit, offset]
    );

    res.json({ 
      success: true, 
      listing_id: listingId,
      ...stats.rows[0],
      reviews: reviews.rows 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReceivedReviews = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    
    const result = await query(
      `SELECT r.id as review_id, l.id as listing_id, l.title as listing_title,
              u.full_name as guest_name, u.avatar_url as guest_avatar,
              r.overall_rating, r.comment, r.host_reply, r.created_at
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.guest_id = u.id
       WHERE l.host_id = $1
       ORDER BY r.created_at DESC`,
      [hostId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const replyToReview = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    const { id: reviewId } = req.params;
    const { reply } = req.body;

    // Verify the host owns the listing for this review
    const ownership = await query(
      `SELECT r.id FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN listings l ON b.listing_id = l.id
       WHERE r.id = $1 AND l.host_id = $2`,
      [reviewId, hostId]
    );

    if (ownership.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized" });

    const result = await query(
      `UPDATE reviews SET host_reply = $1, host_replied_at = NOW() 
       WHERE id = $2 AND host_reply IS NULL
       RETURNING id, host_reply, host_replied_at`,
      [reply, reviewId]
    );

    if (result.rows.length === 0) return res.status(400).json({ success: false, message: "Already replied" });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rateGuest = async (req, res) => { res.json({ success: true, message: 'Guest rated' }); };