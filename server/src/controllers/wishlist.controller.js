import { query } from "../config/db.js";

// Create a new wishlist
export const createWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name } = req.body;

    if (!name) return res.status(400).json({ success: false, message: "Wishlist name is required" });

    const result = await query(
      "INSERT INTO wishlists (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at",
      [userId, name]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all wishlists for a user
export const getWishlists = async (req, res) => {
  try {
    const userId = req.user.sub;
    const result = await query(
      `SELECT w.id as wishlist_id, w.name, w.created_at, COUNT(wi.id)::int as saved_count,
       (SELECT l.photos[1] FROM wishlist_items wi2 
        JOIN listings l ON l.id = wi2.listing_id 
        WHERE wi2.wishlist_id = w.id LIMIT 1) as cover
       FROM wishlists w
       LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
       WHERE w.user_id = $1
       GROUP BY w.id
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a listing to a wishlist
export const addListingToWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id: wishlistId, listingId } = req.params;

    // Verify ownership
    const ownerCheck = await query("SELECT id FROM wishlists WHERE id = $1 AND user_id = $2", [wishlistId, userId]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized" });

    // Idempotent insertion
    await query(
      `INSERT INTO wishlist_items (wishlist_id, listing_id) 
       VALUES ($1, $2) ON CONFLICT ON CONSTRAINT wishlist_items_pkey DO NOTHING`,
      [wishlistId, listingId]
    );

    res.json({ success: true, message: "Listing added to wishlist" });
  } catch (error) {
    if (error.code === '23505') return res.json({ success: true, message: "Listing already in wishlist" });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove listing from wishlist
export const removeListingFromWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id: wishlistId, listingId } = req.params;

    const ownerCheck = await query("SELECT id FROM wishlists WHERE id = $1 AND user_id = $2", [wishlistId, userId]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized" });

    await query("DELETE FROM wishlist_items WHERE wishlist_id = $1 AND listing_id = $2", [wishlistId, listingId]);

    res.json({ success: true, message: "Listing removed from wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const shareWishlist = async (req, res) => { res.json({ success: true, message: 'Wishlist shared (Mock)' }); };

export const deleteWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id: wishlistId } = req.params;

    const result = await query("DELETE FROM wishlists WHERE id = $1 AND user_id = $2 RETURNING id", [wishlistId, userId]);
    if (result.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized or not found" });

    res.json({ success: true, message: "Wishlist deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};