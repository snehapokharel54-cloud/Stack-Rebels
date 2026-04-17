
import { query } from "../config/db.js";

export const getMyProfile = async (req, res) => { 
  try {
    const result = await query(
      'SELECT id, email, full_name, avatar_url, phone, bio, preferred_currency, kyc_status, is_superhost, is_verified, created_at FROM users WHERE id = $1', 
      [req.user.sub]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const updateMyProfile = async (req, res) => { 
  try {
    const userId = req.user.sub;
    const { full_name, phone, bio, preferred_currency, avatar_url } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           bio = COALESCE($3, bio),
           preferred_currency = COALESCE($4, preferred_currency),
           avatar_url = COALESCE($5, avatar_url),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, full_name, phone, bio, preferred_currency, avatar_url, updated_at`,
      [full_name, phone, bio, preferred_currency, avatar_url, userId]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPublicHostProfile = async (req, res) => { 
  try {
    const { id: hostId } = req.params;

    // Fetch Host Info
    const hostResult = await query(
      `SELECT id, full_name, avatar_url, bio, is_superhost, is_verified, created_at as joined_at 
       FROM users WHERE id = $1 AND is_host = TRUE`,
      [hostId]
    );

    if (hostResult.rows.length === 0) return res.status(404).json({ success: false, message: "Host not found" });
    const host = hostResult.rows[0];

    // Fetch Host's Listings
    const listingsResult = await query(
      `SELECT id, title, photos[1] as photo, price_per_night,
       (SELECT COALESCE(AVG(overall_rating), 0) FROM reviews r JOIN bookings b ON r.booking_id = b.id WHERE b.listing_id = listings.id) as average_rating
       FROM listings 
       WHERE host_id = $1 AND status = 'PUBLISHED'`,
      [hostId]
    );

    host.listings = listingsResult.rows;
    host.total_listings = listingsResult.rows.length;

    // Analytics (approx)
    host.response_rate = 98;
    host.response_time = "within an hour";

    res.json({ success: true, data: host });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateFcmToken = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token required" });

    await query("UPDATE users SET fcm_token = $1 WHERE id = $2", [token, userId]);
    res.json({ success: true, message: "FCM Token updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};