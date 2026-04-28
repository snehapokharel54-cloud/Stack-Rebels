import { query } from "../config/db.js";

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const result = await query(
      `SELECT id, full_name, email, phone, is_host, avatar_url, 
              is_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { full_name, phone, avatar_url } = req.body;

    const result = await query(
      `UPDATE users SET
         full_name = COALESCE($2, full_name),
         phone = COALESCE($3, phone),
         avatar_url = COALESCE($4, avatar_url),
         updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, phone, is_host, avatar_url`,
      [userId, full_name, phone, avatar_url]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: result.rows[0], message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPublicHostProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, full_name, avatar_url, is_verified, created_at
       FROM users WHERE id = $1 AND is_host = TRUE`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Host not found" });

    // Count listings
    const listingCount = await query(
      `SELECT COUNT(*) FROM listings WHERE host_id = $1 AND status = 'PUBLISHED'`,
      [id]
    );

    const host = result.rows[0];
    host.listing_count = parseInt(listingCount.rows[0].count);
    res.json({ success: true, data: host });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
