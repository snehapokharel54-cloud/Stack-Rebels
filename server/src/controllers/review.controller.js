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
        COUNT(id)::int as total_reviews,
        COALESCE(AVG(rating), 0)::numeric(3,2) as average_rating
       FROM reviews 
       WHERE property_id = $1`,
      [listingId]
    );

    const reviews = await query(
      `SELECT r.id as review_id, u.full_name as guest_name, u.avatar_url as guest_avatar,
              r.rating, r.comment, r.created_at
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.property_id = $1
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
              r.rating, r.comment, r.created_at
       FROM reviews r
       JOIN listings l ON r.property_id = l.id
       JOIN users u ON r.reviewer_id = u.id
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
  res.status(501).json({ success: false, message: "Host replies to reviews are not currently supported by the database schema." });
};

export const rateGuest = async (req, res) => { res.json({ success: true, message: 'Guest rated' }); };